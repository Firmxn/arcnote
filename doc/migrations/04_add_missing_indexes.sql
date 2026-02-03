-- Add missing indexes for RLS performance (userId)
-- Warning: "Auth RLS Initialization Plan" usually means RLS is doing seq scan
-- We ensure all tables with specific RLS on "userId" have an index on "userId".

-- 1. pages
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages("userId");

-- 2. schedules
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules("userId");

-- 3. wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets("userId");

-- 4. transactions (formerly finance)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions("userId");

-- 5. budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets("userId");

-- 6. budgetAssignments
CREATE INDEX IF NOT EXISTS idx_budget_assignments_user_id ON "budgetAssignments"("userId");

-- 7. recurringTemplates (camelCase table name needs quotes)
-- Already added in 00_..., but `IF NOT EXISTS` is safe.
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id ON "recurringTemplates"("userId");

-- 8. blocks
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks("userId");
