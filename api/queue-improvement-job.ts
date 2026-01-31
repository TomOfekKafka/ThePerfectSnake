import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface QueueJobRequest {
  orderId: string;
  payerId: string;
  payerEmail: string;
  payerFirstName?: string;
  amount: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, payerId, payerEmail, payerFirstName, amount } = req.body as QueueJobRequest;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`Queueing improvement job for order: ${orderId}`);

    // Insert job into database
    await sql`
      INSERT INTO code_improvement_jobs
        (order_id, payer_id, payer_email, payer_first_name, amount, status)
      VALUES
        (${orderId}, ${payerId}, ${payerEmail}, ${payerFirstName || 'Anonymous'}, ${amount}, 'pending')
      ON CONFLICT (order_id) DO NOTHING
    `;

    console.log('Job queued in database');

    // Trigger GitHub Actions via repository_dispatch
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO; // format: "owner/repo"

    if (!githubToken || !githubRepo) {
      console.warn('GitHub configuration missing, job queued but not triggered');
      return res.status(200).json({
        success: true,
        message: 'Job queued (GitHub trigger disabled)',
        warning: 'GitHub Actions not configured'
      });
    }

    const githubResponse = await fetch(
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

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      console.error('GitHub API error:', error);
      throw new Error(`GitHub API returned ${githubResponse.status}`);
    }

    console.log('GitHub Actions triggered successfully');

    return res.status(200).json({
      success: true,
      message: 'Job queued and GitHub Actions triggered'
    });

  } catch (error) {
    console.error('Error queueing job:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue job'
    });
  }
}
