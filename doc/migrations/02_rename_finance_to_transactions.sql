-- Rename table finance to transactions
ALTER TABLE IF EXISTS "finance" RENAME TO "transactions";

-- Rename specific index if it exists
ALTER INDEX IF EXISTS idx_finance_wallet_id RENAME TO idx_transactions_walletId;

-- Rename the existing consolidated policy
-- Note: When table is renamed, the policy is still attached to the new table name automatically.
-- We just need to rename the policy itself for consistency.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can only access their own finance transactions'
    ) THEN
        ALTER POLICY "Users can only access their own finance transactions" ON "transactions" RENAME TO "Users can only access their own transactions";
    END IF;
END $$;
