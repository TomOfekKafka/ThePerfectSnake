-- Code Improvement Jobs Queue
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_status ON code_improvement_jobs(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON code_improvement_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_jobs ON code_improvement_jobs(created_at) WHERE status = 'pending';
