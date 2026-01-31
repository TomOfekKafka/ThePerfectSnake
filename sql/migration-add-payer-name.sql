-- Add payer_first_name column to store contributor name
ALTER TABLE code_improvement_jobs
ADD COLUMN IF NOT EXISTS payer_first_name VARCHAR(100);
