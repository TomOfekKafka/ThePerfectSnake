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
  TOTAL_MAX: 5.00,
  PER_ATTEMPT: 1.50
};

// Claude Haiku 4.5 pricing
const HAIKU_INPUT_PRICE = 1.00 / 1_000_000;
const HAIKU_OUTPUT_PRICE = 5.00 / 1_000_000;

const MAX_ATTEMPTS = 3;
let currentAttempt = 0;
let totalCost = 0;

// Tool implementations
const tools = [
  {
    name: 'read_file',
    description: 'Reads the content of a file from the codebase',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read (e.g., "src/App.tsx")'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Writes content to a file. Creates the file if it doesn\'t exist.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to write to'
        },
        content: {
          type: 'string',
          description: 'The complete content to write to the file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_files',
    description: 'Lists files in the codebase matching a glob pattern',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "src/**/*.tsx")'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'run_build',
    description: 'Runs npm run build to check if the code compiles',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'run_tests',
    description: 'Runs npm test to execute the test suite',
    input_schema: {
      type: 'object',
      properties: {}
    }
  }
];

async function executeTool(toolName, toolInput) {
  console.log(`🔧 Executing tool: ${toolName}`);

  try {
    switch (toolName) {
      case 'read_file': {
        const content = await fs.readFile(toolInput.path, 'utf-8');
        return { success: true, content };
      }

      case 'write_file': {
        const dir = path.dirname(toolInput.path);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(toolInput.path, toolInput.content, 'utf-8');
        return { success: true, message: `File written: ${toolInput.path}` };
      }

      case 'list_files': {
        const { execSync } = await import('child_process');
        const files = execSync(`find . -path "${toolInput.pattern}" -type f`, { encoding: 'utf-8' })
          .split('\n')
          .filter(f => f.trim());
        return { success: true, files };
      }

      case 'run_build': {
        try {
          const output = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
          return { success: true, output };
        } catch (error) {
          return {
            success: false,
            error: error.stderr || error.stdout || error.message
          };
        }
      }

      case 'run_tests': {
        try {
          const output = execSync('npm test -- --passWithNoTests', {
            encoding: 'utf-8',
            stdio: 'pipe',
            env: { ...process.env, CI: 'true' }
          });
          return { success: true, output };
        } catch (error) {
          return {
            success: false,
            error: error.stderr || error.stdout || error.message
          };
        }
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function callClaude(messages, systemPrompt) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    tools: tools,
    messages: messages
  });

  // Calculate cost
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cost = (inputTokens * HAIKU_INPUT_PRICE) + (outputTokens * HAIKU_OUTPUT_PRICE);
  totalCost += cost;

  console.log(`   💰 Cost: $${cost.toFixed(4)} (Total: $${totalCost.toFixed(4)})`);
  console.log(`   📊 Tokens: ${inputTokens} in, ${outputTokens} out`);

  return response;
}

async function runAgent() {
  console.log(`\n🤖 Starting Agent-based improvement for order: ${ORDER_ID}\n`);

  // Claim job from database
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
    return { success: false, reason: 'no_job' };
  }

  const job = result.rows[0];
  console.log(`📋 Processing job #${job.id}`);

  const systemPrompt = `You are an expert software engineer improving a React/TypeScript snake game codebase.

## YOUR MISSION:
Make ONE high-quality, impactful, DRAMATIC visual improvement to the codebase.

## STRICT REQUIREMENTS:

1. TEST COVERAGE
   - Every code change MUST have Jest tests
   - Tests go next to source: Component.tsx → Component.test.tsx
   - Test main functionality and edge cases

2. VERIFICATION
   - After changes, use run_build tool to check compilation
   - Use run_tests tool to verify all tests pass
   - Both MUST succeed before finishing

3. ERROR HANDLING
   - If tests/build fail: analyze the error carefully
   - Fix the issue and re-run verification
   - Maximum 3 attempts total
   - If still failing after 3 attempts: explain the issue and stop

4. QUALITY STANDARDS
   - Changes must be BOLD and DRAMATIC (color changes, animations, gradients)
   - Maintain mobile compatibility (touch controls, responsive design)
   - Don't break existing functionality
   - Write clean, maintainable code

## AVAILABLE TOOLS:
- read_file: Read source code
- write_file: Modify files
- list_files: Explore codebase
- run_build: Check compilation
- run_tests: Run Jest tests

## WORKFLOW:
1. Explore codebase (read key files)
2. Plan the improvement
3. Implement code changes
4. Write/update tests
5. Run build + tests
6. Fix if needed (max 3 attempts)
7. Say "DONE" when all tests pass

Start by exploring the codebase!`;

  const messages = [
    {
      role: 'user',
      content: 'Please make a dramatic visual improvement to the snake game. Explore the code first, then implement your changes with tests.'
    }
  ];

  let continueLoop = true;
  let lastBuildSuccess = false;
  let lastTestSuccess = false;

  while (continueLoop && currentAttempt < MAX_ATTEMPTS && totalCost < BUDGET.TOTAL_MAX) {
    console.log(`\n🔄 Agent iteration ${messages.length / 2 + 1}`);

    const response = await callClaude(messages, systemPrompt);

    // Check stop reason
    if (response.stop_reason === 'end_turn') {
      console.log('✅ Agent finished (end_turn)');
      continueLoop = false;
      break;
    }

    // Process response content
    let toolResults = [];
    let hasToolUse = false;

    for (const content of response.content) {
      if (content.type === 'text') {
        console.log(`💭 Agent: ${content.text.substring(0, 200)}${content.text.length > 200 ? '...' : ''}`);

        // Check if agent says it's done
        if (content.text.includes('DONE') || content.text.includes('completed') || content.text.includes('finished')) {
          continueLoop = false;
        }
      } else if (content.type === 'tool_use') {
        hasToolUse = true;
        const result = await executeTool(content.name, content.input);

        // Track build/test results
        if (content.name === 'run_build') {
          lastBuildSuccess = result.success;
          if (!result.success) currentAttempt++;
        }
        if (content.name === 'run_tests') {
          lastTestSuccess = result.success;
          if (!result.success) currentAttempt++;
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: content.id,
          content: JSON.stringify(result, null, 2)
        });
      }
    }

    // Add assistant message and tool results
    messages.push({
      role: 'assistant',
      content: response.content
    });

    if (toolResults.length > 0) {
      messages.push({
        role: 'user',
        content: toolResults
      });
    } else if (!hasToolUse) {
      // No tool use and no "DONE" signal - agent might be stuck
      continueLoop = false;
    }

    // Check if we should stop
    if (currentAttempt >= MAX_ATTEMPTS) {
      console.log(`\n⚠️  Maximum attempts (${MAX_ATTEMPTS}) reached`);
      continueLoop = false;
    }
  }

  // Final verification
  if (lastBuildSuccess && lastTestSuccess) {
    console.log('\n✅ All checks passed!');

    // Update database
    await sql`
      UPDATE code_improvement_jobs
      SET
        status = 'completed',
        total_cost_usd = ${totalCost},
        completed_at = NOW(),
        build_success = true
      WHERE order_id = ${ORDER_ID}
    `;

    return { success: true };
  } else {
    console.log('\n❌ Agent could not complete successfully');

    // Update database
    await sql`
      UPDATE code_improvement_jobs
      SET
        status = 'failed',
        total_cost_usd = ${totalCost},
        error_message = 'Agent failed to pass all checks after ${currentAttempt} attempts',
        completed_at = NOW(),
        build_success = false
      WHERE order_id = ${ORDER_ID}
    `;

    throw new Error('Agent failed to complete');
  }
}

// Run the agent
runAgent().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
