import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
try {
  const msg = await client.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Hi' }]
  });
  console.log('✅ works!');
  process.exit(0);
} catch (e) {
  console.log('❌', e.error?.message || e.message);
  process.exit(1);
}
