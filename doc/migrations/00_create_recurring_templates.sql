-- Create recurring_templates table
CREATE TABLE IF NOT EXISTS recurring_templates (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    interval TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    next_run_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_generated_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own recurring templates"
    ON recurring_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring templates"
    ON recurring_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring templates"
    ON recurring_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring templates"
    ON recurring_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_recurring_templates_user_id ON recurring_templates(user_id);
CREATE INDEX idx_recurring_templates_wallet_id ON recurring_templates(wallet_id);
