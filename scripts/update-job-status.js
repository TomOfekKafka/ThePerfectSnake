import { sql } from '@vercel/postgres';
import fs from 'fs/promises';

const ORDER_ID = process.env.ORDER_ID;
const TOTAL_COST = parseFloat(process.env.TOTAL_COST || '0');

if (!ORDER_ID) {
  console.error('ORDER_ID environment variable is required');
  process.exit(1);
}

async function updateJobStatus() {
  try {
    console.log(`Updating job status for order: ${ORDER_ID}`);
    console.log(`Total cost: $${TOTAL_COST.toFixed(2)}`);

    // Fetch job details for metadata
    const jobDetails = await sql`
      SELECT payer_first_name FROM code_improvement_jobs
      WHERE order_id = ${ORDER_ID}
    `;

    const payerName = jobDetails.rows[0]?.payer_first_name || 'Anonymous';

    // Write deployment metadata file
    const metadata = {
      lastDeployment: {
        timestamp: new Date().toISOString(),
        contributor: payerName,
        cost: TOTAL_COST.toFixed(2),
        orderId: ORDER_ID
      }
    };

    await fs.mkdir('public', { recursive: true });
    await fs.writeFile(
      'public/deployment-metadata.json',
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    console.log('✅ Deployment metadata written to public/deployment-metadata.json');

    // Update database
    await sql`
      UPDATE code_improvement_jobs
      SET
        status = 'completed',
        total_cost_usd = ${TOTAL_COST},
        completed_at = NOW(),
        build_success = true
      WHERE order_id = ${ORDER_ID}
    `;

    console.log('✅ Database updated successfully');
  } catch (error) {
    console.error('❌ Failed to update job status:', error);
    process.exit(1);
  }
}

updateJobStatus();
