-- Fix Unindexed Foreign Keys
-- Adding indexes to foreign key columns avoids full table scans during joins and cascade deletes.

-- 1. blocks.pageId
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks("pageId");

-- 2. pages.parentId
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages("parentId");

-- 3. transactions.walletId (was flagged as finance_transactions_accountId_fkey)
-- The warning likely referred to the constraint name which might still use 'account' term from legacy or standard naming.
-- We ensure walletId is indexed.
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions("walletId");
