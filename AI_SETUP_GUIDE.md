# AI Code Improvement System - Setup Guide

This guide will help you set up the AI code improvement system that triggers after each PayPal payment.

## Prerequisites

- [x] Vercel account
- [x] GitHub repository connected to Vercel
- [x] PayPal sandbox/production account
- [ ] Vercel Postgres database
- [ ] Anthropic API key
- [ ] GitHub personal access token

---

## Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Navigate to Storage:**
   - Click on "Storage" tab
   - Click "Create Database"
   - Select "Postgres"

3. **Configure database:**
   - Name: `the-perfect-snake-db`
   - Region: Choose closest to you
   - Click "Create"

4. **Run the schema:**
   - Go to your database
   - Click on the ".sql" tab or "Query" tab
   - Copy contents from `sql/schema.sql`
   - Paste and execute

5. **Get connection string:**
   - Go to database settings
   - Copy the `POSTGRES_URL` value
   - It looks like: `postgres://default:...@...vercel-storage.com:5432/verceldb`

---

## Step 2: Get Anthropic API Key

1. **Go to Anthropic Console:**
   https://console.anthropic.com/

2. **Create account or log in**

3. **Get API key:**
   - Go to "API Keys" section
   - Click "Create Key"
   - Name: "The Perfect Snake AI"
   - Copy the key (starts with `sk-ant-`)
   - **Store it safely** - you won't see it again

4. **Add credits (if needed):**
   - Go to "Billing"
   - Add credits ($10 minimum recommended)
   - Each improvement costs ~$0.50-$2.00

---

## Step 3: Create GitHub Personal Access Token

1. **Go to GitHub Settings:**
   https://github.com/settings/tokens

2. **Generate new token:**
   - Click "Generate new token" → "Generate new token (classic)"
   - Note: "The Perfect Snake AI Improvements"
   - Expiration: Choose "No expiration" or custom

3. **Select scopes:**
   - ☑ **repo** (Full control of private repositories)
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events

4. **Generate and copy token:**
   - Click "Generate token"
   - Copy the token (starts with `ghp_`)
   - **Store it safely** - you won't see it again

---

## Step 4: Add Environment Variables to Vercel

1. **Go to project settings:**
   https://vercel.com/toms-projects-63735613/the-perfect-snake/settings/environment-variables

2. **Add these variables (one by one):**

### POSTGRES_URL
   - Name: `POSTGRES_URL`
   - Value: `postgres://default:...` (from Step 1)
   - Environments: ☑ Production ☑ Preview ☑ Development

### ANTHROPIC_API_KEY
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (from Step 2)
   - Environments: ☑ Production ☑ Preview ☑ Development

### GITHUB_TOKEN
   - Name: `GITHUB_TOKEN`
   - Value: `ghp_...` (from Step 3)
   - Environments: ☑ Production ☑ Preview ☑ Development

### GITHUB_REPO
   - Name: `GITHUB_REPO`
   - Value: `TomOfekKafka/ThePerfectSnake`
   - Environments: ☑ Production ☑ Preview ☑ Development

---

## Step 5: Add Secrets to GitHub Repository

1. **Go to repository settings:**
   https://github.com/TomOfekKafka/ThePerfectSnake/settings/secrets/actions

2. **Click "New repository secret"**

3. **Add these secrets:**

### POSTGRES_URL
   - Name: `POSTGRES_URL`
   - Value: (same as Vercel - from Step 1)

### ANTHROPIC_API_KEY
   - Name: `ANTHROPIC_API_KEY`
   - Value: (same as Vercel - from Step 2)

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions

---

## Step 6: Update Local Environment

Update your `.env.local`:

```bash
# PayPal (existing)
VITE_PAYPAL_CLIENT_ID=AXovC1FEOR_BUk1m9hVOJgikYWkNSybahld4MGiBIe_dPWPQs_JsMG0PZwz3-eQI31Oea-u-Nljv1arg
PAYPAL_CLIENT_ID=AXovC1FEOR_BUk1m9hVOJgikYWkNSybahld4MGiBIe_dPWPQs_JsMG0PZwz3-eQI31Oea-u-Nljv1arg
PAYPAL_CLIENT_SECRET=EH-KRMl4nkoRM5N-58tVx7J5tk0qlKzTlg4ZBfcwMMqhVq0U1GVRKdam3OTZFmTdcN0JX6KTSzfatp-_
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# AI System (new)
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=TomOfekKafka/ThePerfectSnake
ANTHROPIC_API_KEY=sk-ant-your_key_here
POSTGRES_URL=postgres://your_connection_string_here
```

Also update `.env`:

```bash
cp .env.local .env
```

---

## Step 7: Test the Database Connection

```bash
node -e "import('@vercel/postgres').then(m => m.sql\`SELECT NOW()\`.then(r => console.log('✅ Database connected:', r.rows[0])))"
```

Expected output:
```
✅ Database connected: { now: 2024-01-30T... }
```

---

## Step 8: Commit and Deploy

```bash
git add .
git commit -m "Add AI code improvement system"
git push origin main
```

Vercel will automatically deploy the changes.

---

## Step 9: Test the System

### Manual Test (without payment):

1. **Trigger GitHub Actions manually:**
   ```bash
   curl -X POST \
     -H "Accept: application/vnd.github.v3+json" \
     -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
     https://api.github.com/repos/TomOfekKafka/ThePerfectSnake/dispatches \
     -d '{"event_type":"ai-code-improvement","client_payload":{"order_id":"test-123"}}'
   ```

2. **Or insert a test job directly:**
   - Go to Vercel Postgres dashboard
   - Run SQL:
     ```sql
     INSERT INTO code_improvement_jobs
       (order_id, payer_id, amount, status)
     VALUES
       ('test-123', 'test-payer', 10.00, 'pending');
     ```

3. **Then trigger manually from GitHub:**
   - Go to: https://github.com/TomOfekKafka/ThePerfectSnake/actions
   - Select "AI Code Improvement" workflow
   - Click "Run workflow"
   - Enter order_id: `test-123`

### Full Test (with payment):

1. **Start local server:**
   ```bash
   vercel dev
   ```

2. **Make a sandbox payment:**
   - Go to http://localhost:3000
   - Click PayPal button
   - Complete payment with sandbox account

3. **Check the flow:**
   - Payment verified ✓
   - Job queued in database ✓
   - GitHub Actions triggered ✓
   - AI improvement runs ✓
   - Code committed and pushed ✓
   - Vercel auto-deploys ✓

4. **Monitor:**
   - Vercel logs: https://vercel.com/toms-projects-63735613/the-perfect-snake/logs
   - GitHub Actions: https://github.com/TomOfekKafka/ThePerfectSnake/actions
   - Database: Vercel Postgres dashboard

---

## Troubleshooting

### "Payment verification service not configured"
- Check PayPal environment variables in Vercel
- Restart `vercel dev`

### "GitHub configuration missing"
- Check `GITHUB_TOKEN` and `GITHUB_REPO` in Vercel
- Token must have `repo` scope

### "Failed to authenticate with PayPal"
- Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Verify they're for the correct environment (sandbox vs production)

### "Database connection failed"
- Check `POSTGRES_URL` in both Vercel and GitHub secrets
- Verify database exists and schema is created

### "Anthropic API error"
- Check `ANTHROPIC_API_KEY` in GitHub secrets
- Verify you have credits in Anthropic account
- Check rate limits

### GitHub Actions not triggering
- Check `GITHUB_TOKEN` has `repo` scope
- Verify webhook in GitHub settings
- Check Vercel function logs for queue-improvement-job

### Build fails in GitHub Actions
- The AI will try to fix it automatically (second attempt)
- If still failing, check the job in database:
  ```sql
  SELECT * FROM code_improvement_jobs ORDER BY created_at DESC LIMIT 5;
  ```

---

## Monitoring

### Check job queue:
```sql
-- All jobs
SELECT id, order_id, status, attempt_number, total_cost_usd, created_at
FROM code_improvement_jobs
ORDER BY created_at DESC;

-- Pending jobs
SELECT * FROM code_improvement_jobs WHERE status = 'pending';

-- Failed jobs
SELECT * FROM code_improvement_jobs WHERE status = 'failed';

-- Total spent
SELECT SUM(total_cost_usd) as total_spent FROM code_improvement_jobs;
```

### Check GitHub Actions:
https://github.com/TomOfekKafka/ThePerfectSnake/actions

### Check Vercel logs:
https://vercel.com/toms-projects-63735613/the-perfect-snake/logs

---

## Cost Monitoring

### Estimated costs:
- **Per successful improvement:** $0.50 - $2.00
- **Per failed build fix:** $0.20 - $1.00
- **Maximum per payment:** $5.00

### Monthly estimates (10 payments):
- AI costs: $5 - $20
- Infrastructure: $0 (free tiers)
- **Total:** $5 - $20/month

### Check Anthropic usage:
https://console.anthropic.com/settings/usage

---

## Next Steps

Once everything is working:

1. **Test with multiple payments** to verify queue works
2. **Monitor costs** in Anthropic console
3. **Adjust prompts** in `prompts/` directory as needed
4. **Review improvements** from AI
5. **Switch to production** PayPal when ready

---

## Optional Enhancements

### Add email notifications:
- Install: `npm install @sendgrid/mail`
- Send email when improvement completes

### Create admin dashboard:
- Create `api/admin/jobs.ts` to view queue
- Add authentication

### Rate limiting:
- Max 1 improvement per hour
- Max 5 improvements per day

### Prompt improvements:
- Let AI improve its own prompts
- A/B test different prompts
- Include user feedback

---

## Support

If you run into issues:
1. Check Vercel logs
2. Check GitHub Actions logs
3. Check database job status
4. Review this guide

Good luck! 🚀
