-- Drop previous table (and policies/indexes via cascade)
DROP TABLE IF EXISTS recurring_templates CASCADE;

-- Create recurringTemplates table with CamelCase columns
-- We use quotes to enforce case sensitivity matching Dexie/JSON fields
CREATE TABLE "recurringTemplates" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "walletId" TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "interval" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "nextRunDate" TIMESTAMPTZ NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "lastGeneratedId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "recurringTemplates" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own recurring templates"
    ON "recurringTemplates" FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own recurring templates"
    ON "recurringTemplates" FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own recurring templates"
    ON "recurringTemplates" FOR UPDATE
    USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own recurring templates"
    ON "recurringTemplates" FOR DELETE
    USING (auth.uid() = "userId");

-- Indexes
CREATE INDEX idx_recurring_templates_user_id ON "recurringTemplates"("userId");
CREATE INDEX idx_recurring_templates_wallet_id ON "recurringTemplates"("walletId");
