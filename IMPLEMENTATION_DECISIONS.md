# Implementation Decisions - AI Code Improvement System

## Your Questions & Answers

### 1. Where is the improvement prompt stored?

**Answer: `prompts/` directory in the repository (version controlled)**

```
ThePerfectSnake/
├── prompts/
│   ├── code-improvement.txt    # Main improvement prompt template
│   └── build-fix.txt            # Prompt for fixing failed builds
```

**Why this approach:**
- ✅ **Version controlled** - Track prompt evolution in git
- ✅ **Easy to improve** - Just edit file and commit
- ✅ **AI can improve itself** - The prompt file can be improved by the AI!
- ✅ **Testable** - Can test prompt changes before production
- ✅ **Future-proof** - Database field `improvement_instructions` for custom prompts later

**How it works:**
```javascript
// Script reads prompt from file
const template = await fs.readFile('prompts/code-improvement.txt', 'utf-8');
// Replace {CODEBASE_CONTENT} with actual code
const prompt = template.replace('{CODEBASE_CONTENT}', codebaseFiles);
// Send to Claude
const response = await claude.messages.create({ content: prompt });
```

---

### 2. Budget allocation: $4 initial + $1 for fixes

**Budget breakdown:**
```javascript
const BUDGET = {
  INITIAL_ATTEMPT: 4.00,  // Try to improve code
  FIX_RESERVE: 1.00,      // If build fails, try to fix
  TOTAL_MAX: 5.00
};
```

**Workflow:**

```
Step 1: Improve code (budget: $4.00)
  ↓
Step 2: Run npm run build
  ↓
  ├─ ✅ Success → Commit & push
  │
  └─ ❌ Build failed
        ↓
     Step 3: Fix build error (budget: remaining $1.00)
        ↓
     Step 4: Run npm run build again
        ↓
        ├─ ✅ Success → Commit & push
        │
        └─ ❌ Still failed → Mark job as failed, don't push
```

**Database tracking:**
- `initial_cost_usd` - Cost of first attempt
- `fix_cost_usd` - Cost of fix attempt (if needed)
- `total_cost_usd` - Total (capped at $5.00)
- `attempt_number` - 1 or 2
- `build_success` - true/false
- `build_error` - Error message if build failed

---

### 3. Deployment: Push immediately to main

**No manual review, full automation:**
```yaml
# GitHub Actions workflow
- name: Commit and push changes
  if: success()  # Only if build passed
  run: |
    git config --global user.name "AI Code Improver"
    git config --global user.email "ai@the-perfect-snake.vercel.app"
    git add .
    git commit -m "AI improvement from payment ${ORDER_ID}"
    git push origin main
```

**Safety:**
- Only pushes if `npm run build` succeeds
- If build fails twice, job marked as failed (no push)
- Vercel auto-deploys after push (already configured)

---

### 4. Queue: Process payments sequentially

**One job at a time to avoid conflicts:**

```javascript
// Atomic job claiming (PostgreSQL row-level locking)
const job = await sql`
  UPDATE code_improvement_jobs
  SET status = 'processing', started_at = NOW()
  WHERE id = (
    SELECT id FROM code_improvement_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC  -- First In, First Out
    LIMIT 1
    FOR UPDATE SKIP LOCKED    -- Don't wait if another worker claimed it
  )
  RETURNING *
`;
```

**Example with multiple payments:**
```
Payment 1 ($10) → Job 1 created → Processing...
Payment 2 ($10) → Job 2 created → Waiting in queue
Payment 3 ($10) → Job 3 created → Waiting in queue

[Job 1 finishes, pushes to main, deploys]
  ↓
Job 2 starts processing...
  ↓
[Job 2 finishes, pushes to main, deploys]
  ↓
Job 3 starts processing...
```

**Why sequential:**
- ✅ No merge conflicts
- ✅ Each improvement builds on previous ones
- ✅ Clear audit trail
- ✅ Simple to debug

**Processing time:**
- AI call: ~10-30 seconds
- Build: ~20-30 seconds
- Commit & deploy: ~30 seconds
- **Total: ~1-2 minutes per job**

If 5 people pay at once, last person waits ~8-10 minutes.

---

### 5. Anonymous: No payer info in prompts

**Database stores payer info:**
```sql
-- Stored but NOT sent to AI
payer_id VARCHAR(255),
payer_email VARCHAR(255),
```

**Not included in prompt:**
- Payer name
- Payer email
- Payment details

**Prompt only receives:**
- Current codebase
- Generic improvement instructions
- Build errors (if fixing)

**Future enhancement option:**
Could add "contributor credits" file that AI updates:
```javascript
// contributors.json (optional future feature)
{
  "improvements": [
    {
      "date": "2026-01-30",
      "contributor": "anonymous",
      "change": "Improved snake collision detection"
    }
  ]
}
```

---

## File Structure Summary

```
ThePerfectSnake/
├── prompts/
│   ├── code-improvement.txt          # Main prompt (YOUR CONTROL)
│   └── build-fix.txt                 # Fix prompt (YOUR CONTROL)
├── scripts/
│   └── improve-code.js               # AI worker script
├── api/
│   ├── verify-payment.ts             # Modified: call queue after verify
│   └── queue-improvement-job.ts      # New: create job + trigger GitHub
├── .github/
│   └── workflows/
│       └── ai-code-improvement.yml   # GitHub Actions workflow
└── sql/
    └── schema.sql                    # Database schema
```

---

## Example Full Flow

**User pays $10 via PayPal:**

1. PayPal processes payment
2. `api/verify-payment.ts` verifies with PayPal API
3. `api/queue-improvement-job.ts` creates database entry:
   ```sql
   INSERT INTO code_improvement_jobs
   (order_id, payer_id, amount, status)
   VALUES ('PAY-123', 'PAYER-456', 10.00, 'pending')
   ```
4. Triggers GitHub Actions via webhook
5. GitHub Actions workflow starts:
   - Runs `scripts/improve-code.js`
   - Script claims job from queue (atomically)
   - Reads `prompts/code-improvement.txt`
   - Reads codebase files
   - Calls Claude API (budget: $4)
   - Applies code changes
   - Runs `npm run build`
   - ✅ **If build succeeds:**
     - Commits changes
     - Pushes to main
     - Vercel auto-deploys
     - Marks job as completed
   - ❌ **If build fails:**
     - Reads `prompts/build-fix.txt`
     - Calls Claude API with error (budget: $1)
     - Applies fixes
     - Runs `npm run build` again
     - If succeeds: commit & push
     - If fails: mark job as failed

---

## Cost & Timing Estimates

**Per successful improvement:**
- AI cost: $0.50 - $2.00 (Haiku is cheap)
- Time: 1-2 minutes
- Infrastructure: $0 (free tiers)

**If build fails and needs fix:**
- Additional AI cost: $0.20 - $1.00
- Additional time: 30-60 seconds
- Total: $0.70 - $3.00, 1.5-3 minutes

**Monthly (10 payments):**
- AI costs: $5 - $20
- Everything else: Free
- **Total: $5 - $20/month**

---

## Next Steps to Implement

When you're ready to build this:

1. **Phase 1: Database** (30 min)
   - Create Vercel Postgres database
   - Run schema.sql

2. **Phase 2: Prompts** (15 min)
   - Create `prompts/code-improvement.txt`
   - Create `prompts/build-fix.txt`

3. **Phase 3: Backend** (60 min)
   - Create `api/queue-improvement-job.ts`
   - Modify `api/verify-payment.ts`
   - Add environment variables

4. **Phase 4: Worker Script** (90 min)
   - Create `scripts/improve-code.js`
   - Test locally

5. **Phase 5: GitHub Actions** (45 min)
   - Create workflow file
   - Add GitHub secrets
   - Test with manual trigger

6. **Phase 6: Integration Testing** (60 min)
   - Test with sandbox payment
   - Verify full flow
   - Check edge cases

**Total: ~5 hours**

---

## Questions Before Implementation?

Let me know if you want to:
- Adjust the prompt strategy
- Change budget allocation
- Add notifications (email when done?)
- Modify queue behavior
- Add safety limits (max X improvements per day?)
