-- Optimize RLS Policies
-- Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation for each row.
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- 1. PAGES
DROP POLICY IF EXISTS "Users can only access their own pages" ON "pages";
CREATE POLICY "Users can only access their own pages" ON "pages"
AS PERMISSIVE FOR ALL
TO public
USING ("userId" = (select auth.uid()));

-- 2. SCHEDULES
DROP POLICY IF EXISTS "Users can only access their own schedules" ON "schedules";
CREATE POLICY "Users can only access their own schedules" ON "schedules"
AS PERMISSIVE FOR ALL
TO public
USING ("userId" = (select auth.uid()));

-- 3. WALLETS
DROP POLICY IF EXISTS "Users can only access their own finance accounts" ON "wallets";
CREATE POLICY "Users can only access their own finance accounts" ON "wallets"
AS PERMISSIVE FOR ALL
TO public
USING ("userId" = (select auth.uid()));

-- 4. TRANSACTIONS
DROP POLICY IF EXISTS "Users can only access their own transactions" ON "transactions";
CREATE POLICY "Users can only access their own transactions" ON "transactions"
AS PERMISSIVE FOR ALL
TO public
USING ("userId" = (select auth.uid()));

-- 5. RECURRING TEMPLATES
DROP POLICY IF EXISTS "Users can view their own recurring templates" ON "recurringTemplates";
CREATE POLICY "Users can view their own recurring templates" ON "recurringTemplates" FOR SELECT USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own recurring templates" ON "recurringTemplates";
CREATE POLICY "Users can insert their own recurring templates" ON "recurringTemplates" FOR INSERT WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own recurring templates" ON "recurringTemplates";
CREATE POLICY "Users can update their own recurring templates" ON "recurringTemplates" FOR UPDATE USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own recurring templates" ON "recurringTemplates";
CREATE POLICY "Users can delete their own recurring templates" ON "recurringTemplates" FOR DELETE USING ("userId" = (select auth.uid()));

-- 6. BUDGET ASSIGNMENTS
DROP POLICY IF EXISTS "Users can view their own budget assignments" ON "budgetAssignments";
CREATE POLICY "Users can view their own budget assignments" ON "budgetAssignments" FOR SELECT USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own budget assignments" ON "budgetAssignments";
CREATE POLICY "Users can insert their own budget assignments" ON "budgetAssignments" FOR INSERT WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own budget assignments" ON "budgetAssignments";
CREATE POLICY "Users can delete their own budget assignments" ON "budgetAssignments" FOR DELETE USING ("userId" = (select auth.uid()));

-- 7. BUDGETS
DROP POLICY IF EXISTS "Users can view their own budgets" ON "budgets";
CREATE POLICY "Users can view their own budgets" ON "budgets" FOR SELECT USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own budgets" ON "budgets";
CREATE POLICY "Users can insert their own budgets" ON "budgets" FOR INSERT WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own budgets" ON "budgets";
CREATE POLICY "Users can update their own budgets" ON "budgets" FOR UPDATE USING ("userId" = (select auth.uid())) WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own budgets" ON "budgets";
CREATE POLICY "Users can delete their own budgets" ON "budgets" FOR DELETE USING ("userId" = (select auth.uid()));

-- 8. BLOCKS
DROP POLICY IF EXISTS "Users can view own blocks" ON "blocks";
CREATE POLICY "Users can view own blocks" ON "blocks" FOR SELECT USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own blocks" ON "blocks";
CREATE POLICY "Users can insert own blocks" ON "blocks" FOR INSERT WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own blocks" ON "blocks";
CREATE POLICY "Users can update own blocks" ON "blocks" FOR UPDATE USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own blocks" ON "blocks";
CREATE POLICY "Users can delete own blocks" ON "blocks" FOR DELETE USING ("userId" = (select auth.uid()));
