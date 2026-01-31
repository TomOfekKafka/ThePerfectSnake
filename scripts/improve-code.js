import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ORDER_ID = process.env.ORDER_ID;

if (!ORDER_ID) {
  console.error('ORDER_ID environment variable is required');
  process.exit(1);
}

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
  console.log(`\n🚀 Starting AI improvement for order: ${ORDER_ID}\n`);

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
    console.log(`📋 Processing job #${job.id}`);

    // Read codebase files
    console.log('📖 Reading codebase...');
    const codebase = await readCodebase();
    console.log(`   Found ${Object.keys(codebase).length} files`);

    // Attempt 1: Initial improvement
    console.log('\n🤖 Attempt 1: Running initial improvement (budget: $4.00)...');
    const { response: improvement, cost: initialCost, tokens } = await callClaude(
      await buildPrompt(codebase, job.improvement_instructions),
      BUDGET.INITIAL_ATTEMPT
    );

    console.log(`   ✓ Cost: $${initialCost.toFixed(4)}`);
    console.log(`   ✓ Tokens: ${tokens.input} in, ${tokens.output} out`);

    // Apply changes
    console.log('✏️  Applying code changes...');
    const changedFiles = await applyCodeChanges(improvement);
    console.log(`   ✓ Modified ${changedFiles.length} file(s): ${changedFiles.join(', ')}`);

    // Try to build
    console.log('\n🔨 Building project...');
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
          llm_tokens_used = ${tokens.input + tokens.output},
          completed_at = NOW(),
          build_success = true
        WHERE order_id = ${ORDER_ID}
      `;
      console.log('   ✅ Build successful!\n');
      console.log('✨ AI improvement completed successfully!');
      console.log(`💰 Total cost: $${initialCost.toFixed(4)}\n`);
      return;
    }

    // Build failed, try to fix with remaining budget
    console.log('   ⚠️  Build failed');
    console.log(`\n🔧 Attempt 2: Attempting to fix build errors...`);

    const remainingBudget = BUDGET.TOTAL_MAX - initialCost;
    console.log(`   Budget remaining: $${remainingBudget.toFixed(2)}`);

    if (remainingBudget < 0.10) {
      throw new Error('Insufficient budget remaining to fix build errors');
    }

    // Attempt 2: Fix the build error
    const fixPrompt = await buildFixPrompt(buildResult.error, improvement);
    const { response: fix, cost: fixCost, tokens: fixTokens } = await callClaude(
      fixPrompt,
      remainingBudget
    );

    console.log(`   ✓ Cost: $${fixCost.toFixed(4)}`);
    console.log(`   ✓ Tokens: ${fixTokens.input} in, ${fixTokens.output} out`);

    // Apply fix
    console.log('✏️  Applying fixes...');
    const fixedFiles = await applyCodeChanges(fix);
    console.log(`   ✓ Modified ${fixedFiles.length} file(s): ${fixedFiles.join(', ')}`);

    // Try to build again
    console.log('\n🔨 Building project again...');
    const buildResult2 = await tryBuild();

    if (buildResult2.success) {
      // Success on second attempt
      const totalCost = initialCost + fixCost;
      const totalTokens = tokens.input + tokens.output + fixTokens.input + fixTokens.output;

      await sql`
        UPDATE code_improvement_jobs
        SET
          status = 'completed',
          attempt_number = 2,
          initial_cost_usd = ${initialCost},
          fix_cost_usd = ${fixCost},
          total_cost_usd = ${totalCost},
          llm_tokens_used = ${totalTokens},
          completed_at = NOW(),
          build_success = true,
          build_error = ${buildResult.error}
        WHERE order_id = ${ORDER_ID}
      `;
      console.log('   ✅ Build successful after fix!\n');
      console.log('✨ AI improvement completed successfully!');
      console.log(`💰 Total cost: $${totalCost.toFixed(4)} (initial: $${initialCost.toFixed(4)}, fix: $${fixCost.toFixed(4)})\n`);
      return;
    }

    // Still failed after fix attempt
    throw new Error(`Build failed after fix attempt: ${buildResult2.error}`);

  } catch (error) {
    console.error('\n❌ Error during improvement:', error.message);

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

  if (cost > maxBudget) {
    throw new Error(`Cost $${cost.toFixed(2)} exceeds budget $${maxBudget.toFixed(2)}`);
  }

  return {
    response: message.content[0].text,
    cost,
    tokens: { input: inputTokens, output: outputTokens }
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
    'src/components/GameBoard.css',
    'src/components/PayPalButton.tsx',
    'src/types/types.ts',
    'package.json'
  ];

  const codebase = {};
  for (const file of files) {
    try {
      codebase[file] = await fs.readFile(file, 'utf-8');
    } catch (e) {
      console.warn(`   Could not read ${file}`);
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
  const fileRegex = /FILE:\s*(.+?)\s*\n```(?:typescript|tsx|ts|css|json)?\s*\n([\s\S]+?)```/g;

  const changedFiles = [];
  let match;

  while ((match = fileRegex.exec(response)) !== null) {
    const [, filePath, content] = match;
    const cleanPath = filePath.trim();

    console.log(`   → ${cleanPath}`);

    // Ensure directory exists
    const dir = path.dirname(cleanPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(cleanPath, content.trim(), 'utf-8');
    changedFiles.push(cleanPath);
  }

  if (changedFiles.length === 0) {
    throw new Error('No file changes found in AI response');
  }

  return changedFiles;
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
