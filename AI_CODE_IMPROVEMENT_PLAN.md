# AI Code Improvement System - Implementation Plan

## Overview
System that processes PayPal payments and uses AI to improve the codebase automatically, with a $5 budget limit per improvement.

## Architecture

```
PayPal Payment
  ↓
api/verify-payment.ts (existing)
  ↓
api/queue-improvement-job.ts (new)
  ↓
Vercel Postgres Database (queue)
  ↓
GitHub Actions (triggered via repository_dispatch)
  ↓
AI Code Improvement Workflow
  ↓
Commit & Push to main
  ↓
Vercel Auto-Deploy (existing)
```

---

## Phase 1: Database Setup

### 1.1 Install Vercel Postgres

```bash
npm install @vercel/postgres
```

### 1.2 Create Database (via Vercel Dashboard)

1. Go to Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Name: `the-perfect-snake-db`
4. Connect to project

### 1.3 Database Schema

Create file: `sql/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS code_improvement_jobs (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  payer_id VARCHAR(255),
  payer_email VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'processing', 'completed', 'failed'

  -- AI details
  improvement_instructions TEXT, -- Optional custom instructions (NULL = use default prompt)
  llm_provider VARCHAR(50) DEFAULT 'anthropic',
  llm_model VARCHAR(100) DEFAULT 'claude-3-5-haiku-20241022',

  -- Budget tracking
  attempt_number INT DEFAULT 0,
  initial_cost_usd DECIMAL(10,4) DEFAULT 0,
  fix_cost_usd DECIMAL(10,4) DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  llm_tokens_used INT DEFAULT 0,

  -- Results
  commit_sha VARCHAR(255),
  build_success BOOLEAN,
  build_error TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Constraints
  CONSTRAINT cost_limit CHECK (total_cost_usd <= 5.00)
);

CREATE INDEX idx_status ON code_improvement_jobs(status);
CREATE INDEX idx_created_at ON code_improvement_jobs(created_at);
CREATE INDEX idx_pending_jobs ON code_improvement_jobs(created_at) WHERE status = 'pending';
```

Run via Vercel Dashboard SQL editor or deployment script.

---

## Phase 2: Backend Changes

### 2.1 Update Payment Verification

Modify: `api/verify-payment.ts`

**Add after successful verification:**
```typescript
// After payment is verified successfully
// Call queue-improvement-job endpoint
await fetch('/api/queue-improvement-job', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    payerId: orderData.payer.payer_id,
    payerEmail: orderData.payer.email_address,
    amount: orderData.purchase_units[0].amount.value
  })
});
```

### 2.2 Create Job Queue Endpoint

New file: `api/queue-improvement-job.ts`

```typescript
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface QueueJobRequest {
  orderId: string;
  payerId: string;
  payerEmail: string;
  amount: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, payerId, payerEmail, amount } = req.body as QueueJobRequest;

  try {
    // Insert job into database
    await sql`
      INSERT INTO code_improvement_jobs
        (order_id, payer_id, payer_email, amount, status)
      VALUES
        (${orderId}, ${payerId}, ${payerEmail}, ${amount}, 'pending')
    `;

    // Trigger GitHub Actions via repository_dispatch
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO; // format: "owner/repo"

    await fetch(
      `https://api.github.com/repos/${githubRepo}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'ai-code-improvement',
          client_payload: {
            order_id: orderId
          }
        })
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Job queued successfully'
    });

  } catch (error) {
    console.error('Error queueing job:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to queue job'
    });
  }
}
```

### 2.3 Environment Variables

Add to `.env.example` and Vercel Dashboard:

```
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_REPO=TomOfekKafka/ThePerfectSnake
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
MAX_IMPROVEMENT_COST_USD=5.00
```

**GitHub Token Setup:**
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Scopes needed: `repo` (full control)
4. Add to Vercel environment variables

---

## Phase 3: GitHub Actions Workflow

### 3.1 Create Workflow File

New file: `.github/workflows/ai-code-improvement.yml`

```yaml
name: AI Code Improvement

on:
  repository_dispatch:
    types: [ai-code-improvement]

jobs:
  improve-code:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run AI code improvement
        env:
          ORDER_ID: ${{ github.event.client_payload.order_id }}
          POSTGRES_URL: ${{ secrets.POSTGRES_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MAX_IMPROVEMENT_COST_USD: ${{ secrets.MAX_IMPROVEMENT_COST_USD }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/improve-code.js

      - name: Build and verify
        run: npm run build

      - name: Commit and push changes
        if: success()
        run: |
          git config --global user.name "AI Code Improver"
          git config --global user.email "ai@the-perfect-snake.vercel.app"
          git add .
          git commit -m "AI improvement from payment ${{ github.event.client_payload.order_id }}" || echo "No changes to commit"
          git push origin main
```

### 3.2 GitHub Secrets Setup

Add in GitHub repository settings → Secrets and variables → Actions:

- `POSTGRES_URL` - from Vercel Postgres
- `ANTHROPIC_API_KEY` - from Anthropic console
- `MAX_IMPROVEMENT_COST_USD` - "5.00"
- `GITHUB_TOKEN` - automatically available

---

## Phase 4: Prompt Templates

### 4.1 Create Prompt Files

New file: `prompts/code-improvement.txt`

```
You are an expert code improver working on "The Perfect Snake" - a React-based snake game.

Your task: Make ONE small, meaningful improvement to the codebase.

REQUIREMENTS:
- Make ONLY ONE focused improvement (don't try multiple things)
- Budget: Use maximum $4 worth of tokens for this response
- Focus areas: code quality, performance, user experience, visual polish, or gameplay
- Keep changes minimal and safe
- DON'T break existing functionality
- Ensure TypeScript compiles correctly
- Maintain existing code style

CODEBASE:
{CODEBASE_CONTENT}

RESPONSE FORMAT (use exactly this structure):

FILE: path/to/file.ts
```typescript
// complete file content with your improvement
```

FILE: path/to/another-file.css
```css
/* complete file content if needed */
```

EXPLANATION:
One paragraph explaining what you improved and why it matters.

IMPORTANT: Your changes will be applied automatically and must compile successfully.
```

New file: `prompts/build-fix.txt`

```
The previous code improvement failed to build. You have $1 remaining to fix it.

BUILD ERROR:
{BUILD_ERROR}

PREVIOUS CHANGES:
{PREVIOUS_CHANGES}

Your task: Fix ONLY the build error. Don't add new features.

RESPONSE FORMAT:
FILE: path/to/file.ts
```typescript
// corrected complete file content
```

EXPLANATION:
Brief explanation of what was wrong and how you fixed it.
```

### 4.2 Create Main Script

New file: `scripts/improve-code.js`

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ORDER_ID = process.env.ORDER_ID;

// Budget allocation
const BUDGET = {
  INITIAL_ATTEMPT: 4.00,
  FIX_RESERVE: 1.00,
  TOTAL_MAX: 5.00
};

// Claude Haiku pricing (as of 2024)
const HAIKU_INPUT_PRICE = 0.25 / 1_000_000;  // $0.25 per million tokens
const HAIKU_OUTPUT_PRICE = 1.25 / 1_000_000; // $1.25 per million tokens

async function main() {
  console.log(`Starting AI improvement for order: ${ORDER_ID}`);

  try {
    // Atomically claim next pending job (queue processing)
    const result = await sql`
      UPDATE code_improvement_jobs
      SET status = 'processing', started_at = NOW()
      WHERE id = (
        SELECT id FROM code_improvement_jobs
        WHERE status = 'pending' AND order_id = ${ORDER_ID}
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      console.log('No pending job found or job already being processed');
      return;
    }

    const job = result.rows[0];

    // Read codebase files
    const codebase = await readCodebase();

    // Attempt 1: Initial improvement
    console.log('Attempt 1: Running initial improvement...');
    const { response: improvement, cost: initialCost } = await callClaude(
      await buildPrompt(codebase, job.improvement_instructions),
      BUDGET.INITIAL_ATTEMPT
    );

    // Apply changes
    await applyCodeChanges(improvement);

    // Try to build
    console.log('Running build...');
    const buildResult = await tryBuild();

    if (buildResult.success) {
      // Success! Update job and we're done
      await sql`
        UPDATE code_improvement_jobs
        SET
          status = 'completed',
          attempt_number = 1,
          initial_cost_usd = ${initialCost},
          total_cost_usd = ${initialCost},
          completed_at = NOW(),
          build_success = true
        WHERE order_id = ${ORDER_ID}
      `;
      console.log('✅ Build successful! Changes ready to commit.');
      return;
    }

    // Build failed, try to fix with remaining budget
    console.log('⚠️ Build failed, attempting to fix...');
    const remainingBudget = BUDGET.TOTAL_MAX - initialCost;

    if (remainingBudget < 0.10) {
      throw new Error('Insufficient budget remaining to fix build errors');
    }

    // Attempt 2: Fix the build error
    console.log(`Attempt 2: Fixing build (budget: $${remainingBudget.toFixed(2)})...`);
    const fixPrompt = await buildFixPrompt(buildResult.error, improvement);
    const { response: fix, cost: fixCost } = await callClaude(
      fixPrompt,
      remainingBudget
    );

    // Apply fix
    await applyCodeChanges(fix);

    // Try to build again
    console.log('Running build again...');
    const buildResult2 = await tryBuild();

    if (buildResult2.success) {
      // Success on second attempt
      const totalCost = initialCost + fixCost;
      await sql`
        UPDATE code_improvement_jobs
        SET
          status = 'completed',
          attempt_number = 2,
          initial_cost_usd = ${initialCost},
          fix_cost_usd = ${fixCost},
          total_cost_usd = ${totalCost},
          completed_at = NOW(),
          build_success = true,
          build_error = ${buildResult.error}
        WHERE order_id = ${ORDER_ID}
      `;
      console.log('✅ Build successful after fix! Changes ready to commit.');
      return;
    }

    // Still failed after fix attempt
    throw new Error(`Build failed after fix attempt: ${buildResult2.error}`);

  } catch (error) {
    console.error('❌ Error during improvement:', error);

    // Update job with failure
    await sql`
      UPDATE code_improvement_jobs
      SET
        status = 'failed',
        error_message = ${error.message},
        completed_at = NOW(),
        build_success = false
      WHERE order_id = ${ORDER_ID}
    `;

    throw error;
  }
}

async function callClaude(prompt, maxBudget) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  // Calculate cost
  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
  const cost = (inputTokens * HAIKU_INPUT_PRICE) + (outputTokens * HAIKU_OUTPUT_PRICE);

  console.log(`  Tokens: ${inputTokens} in, ${outputTokens} out`);
  console.log(`  Cost: $${cost.toFixed(4)}`);

  if (cost > maxBudget) {
    throw new Error(`Cost $${cost.toFixed(2)} exceeds budget $${maxBudget.toFixed(2)}`);
  }

  return {
    response: message.content[0].text,
    cost
  };
}

function tryBuild() {
  try {
    execSync('npm run build', {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.stderr || error.stdout || error.message
    };
  }
}

async function readCodebase() {
  const files = [
    'src/App.tsx',
    'src/App.css',
    'src/hooks/useSnakeGame.ts',
    'src/components/GameBoard.tsx',
    'src/components/PayPalButton.tsx',
    'package.json'
  ];

  const codebase = {};
  for (const file of files) {
    try {
      codebase[file] = await fs.readFile(file, 'utf-8');
    } catch (e) {
      console.warn(`Could not read ${file}`);
    }
  }

  return codebase;
}

async function buildPrompt(codebase, customInstructions = null) {
  // Read prompt template from file
  let template = await fs.readFile('prompts/code-improvement.txt', 'utf-8');

  // Replace {CODEBASE_CONTENT} with actual codebase
  const codebaseContent = Object.entries(codebase)
    .map(([file, content]) => `\n=== ${file} ===\n${content}`)
    .join('\n\n');

  template = template.replace('{CODEBASE_CONTENT}', codebaseContent);

  // Add custom instructions if provided (future enhancement)
  if (customInstructions) {
    template = `${template}\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
  }

  return template;
}

async function buildFixPrompt(buildError, previousChanges) {
  let template = await fs.readFile('prompts/build-fix.txt', 'utf-8');

  template = template.replace('{BUILD_ERROR}', buildError);
  template = template.replace('{PREVIOUS_CHANGES}', previousChanges);

  return template;
}

async function applyCodeChanges(response) {
  // Parse the response and extract file changes
  const fileRegex = /FILE: (.+?)\n```(?:typescript|tsx|css|json)?\n([\s\S]+?)```/g;

  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const [, filePath, content] = match;
    console.log(`Applying changes to: ${filePath}`);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content.trim(), 'utf-8');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### 4.2 Install Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@vercel/postgres": "^0.10.0"
  }
}
```

---

## Phase 5: Testing Plan

### 5.1 Local Testing

1. **Test database connection:**
```bash
node -e "import('@vercel/postgres').then(m => m.sql\`SELECT 1\`.then(console.log))"
```

2. **Test AI script manually:**
```bash
ORDER_ID=test-123 node scripts/improve-code.js
```

3. **Test payment flow locally:**
```bash
vercel dev
# Make a sandbox payment
# Check database for job entry
```

### 5.2 Production Testing

1. Make a $10 sandbox payment
2. Check Vercel logs for job queuing
3. Check GitHub Actions tab for workflow run
4. Verify code changes pushed to main
5. Verify auto-deployment happened
6. Check database for completed job

### 5.3 Safety Checks

- [ ] `npm run build` passes before pushing
- [ ] Git commit has proper message with order ID
- [ ] Database tracks all jobs
- [ ] Cost never exceeds $5
- [ ] Failed builds don't push to main
- [ ] Error messages logged properly

---

## Phase 6: Monitoring & Observability

### 6.1 Dashboard Queries

Useful SQL queries for monitoring:

```sql
-- View all jobs
SELECT * FROM code_improvement_jobs ORDER BY created_at DESC;

-- Pending jobs
SELECT * FROM code_improvement_jobs WHERE status = 'pending';

-- Failed jobs
SELECT * FROM code_improvement_jobs WHERE status = 'failed';

-- Total cost spent
SELECT SUM(llm_cost_usd) as total_cost FROM code_improvement_jobs;

-- Average cost per job
SELECT AVG(llm_cost_usd) as avg_cost FROM code_improvement_jobs
WHERE status = 'completed';
```

### 6.2 Optional: Admin Dashboard

Create: `api/admin/jobs.ts`

Simple endpoint to view job status (add authentication!):

```typescript
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // TODO: Add authentication check

  const jobs = await sql`
    SELECT * FROM code_improvement_jobs
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return res.json(jobs.rows);
}
```

---

## Phase 7: Improvements & Scaling

### Future Enhancements (not in initial implementation):

1. **Multiple improvement types:**
   - Let payer choose: "performance", "ui", "features"
   - Store choice in database

2. **Review before deploy:**
   - Create PR instead of direct push
   - Manual review and merge

3. **Notification system:**
   - Email payer when improvement is done
   - Slack notifications for admins

4. **Rate limiting:**
   - Max 1 improvement per hour
   - Max 5 improvements per day

5. **A/B testing:**
   - Deploy to preview URL first
   - Compare metrics before promoting

6. **Better prompts:**
   - Include test results
   - Include user feedback
   - Prioritize issues from backlog

---

## Cost Analysis

### Per Payment:
- Claude Haiku API: ~$0.50 - $2.00
- Vercel Postgres: Free tier (10k rows)
- GitHub Actions: Free (public repo)
- Vercel hosting: Free tier

### Monthly (assuming 10 payments):
- API costs: $5 - $20
- Infrastructure: $0 (free tiers)
- **Total: $5 - $20/month**

---

## Security Considerations

### Critical:
1. **GitHub Token:** Never expose in frontend
2. **Database:** Use connection pooling, prepared statements
3. **Code safety:** Always run build before pushing
4. **Rate limiting:** Prevent abuse
5. **Admin endpoints:** Add authentication
6. **LLM output:** Sanitize/validate before applying

### Recommendations:
- Use GitHub repository secrets (not environment variables)
- Implement job retry limits (max 3 attempts)
- Add webhook signature verification for GitHub
- Log all operations for audit trail

---

## Implementation Checklist

### Database:
- [ ] Create Vercel Postgres database
- [ ] Run schema.sql
- [ ] Add POSTGRES_URL to environment variables
- [ ] Test connection

### Backend:
- [ ] Install @vercel/postgres
- [ ] Create api/queue-improvement-job.ts
- [ ] Modify api/verify-payment.ts
- [ ] Add environment variables to Vercel
- [ ] Test job queueing

### GitHub:
- [ ] Create GitHub personal access token
- [ ] Add token to Vercel environment
- [ ] Create .github/workflows/ai-code-improvement.yml
- [ ] Add secrets to GitHub repository
- [ ] Test repository_dispatch trigger

### AI Script:
- [ ] Install @anthropic-ai/sdk
- [ ] Create scripts/improve-code.js
- [ ] Add Anthropic API key to GitHub secrets
- [ ] Test script locally
- [ ] Test in GitHub Actions

### Testing:
- [ ] Test full flow with sandbox payment
- [ ] Verify database updates
- [ ] Verify GitHub Actions runs
- [ ] Verify code changes pushed
- [ ] Verify auto-deployment
- [ ] Test failure scenarios

### Documentation:
- [ ] Update README with new system
- [ ] Document admin queries
- [ ] Add troubleshooting guide

---

## Rollback Plan

If something goes wrong:

1. **Disable system:**
```typescript
// In api/queue-improvement-job.ts
if (process.env.AI_IMPROVEMENTS_ENABLED !== 'true') {
  return res.json({ message: 'System temporarily disabled' });
}
```

2. **Revert code changes:**
```bash
git revert <commit-sha>
git push origin main
```

3. **Clear queue:**
```sql
UPDATE code_improvement_jobs
SET status = 'cancelled'
WHERE status = 'pending';
```

---

## Next Steps

When ready to implement:

1. Start with Phase 1 (Database)
2. Then Phase 2 (Backend)
3. Test thoroughly before Phase 3 (GitHub Actions)
4. Implement Phase 4 (AI Script) last
5. Do extensive testing before going live

Estimated implementation time: 4-6 hours

---

## Questions to Consider Before Implementation

1. **What types of improvements do you want?**
   - Performance optimizations?
   - UI/UX enhancements?
   - New features?
   - Bug fixes?

2. **How should we handle failures?**
   - Retry automatically?
   - Notify admin?
   - Refund payment?

3. **Review process?**
   - Auto-deploy or manual review?
   - Create PR or push to main?

4. **Multiple payments?**
   - Queue them sequentially?
   - Run in parallel?
   - Limit rate?

Let me know your thoughts on these questions!
