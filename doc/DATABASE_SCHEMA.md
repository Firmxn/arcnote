# ArcNote Database Schema (Dexie.js)

This document details the local database schema used by Dexie.js in ArcNote.
All field names are in **camelCase** to match TypeScript interfaces.
Supabase tables should generally follow **camelCase** or snake_case mapped via `sync.ts`.

> **Current Database Version**: 12

## 1. Tables Overview

| Table Name | Description | Key Indexes |
| :--- | :--- | :--- |
| `wallets` | Finance wallets/accounts | `id, title, isMain, isArchived, syncStatus` |
| `finance` | Transactions (Income/Expense/Transfer) | `id, walletId, type, category, date, amount, syncStatus` |
| `budgets` | Budget planning goals | `id, title, period, isArchived, syncStatus` |
| `budgetAssignments` | Links transactions to budgets | `id, budgetId, transactionId, [budgetId+transactionId]` |
| `pages` | Hierarchical note pages | `id, title, parentId, isArchived, syncStatus` |
| `blocks` | Content blocks within pages | `id, pageId, type, order, syncStatus` |
| `schedules` | Calendar events/tasks | `id, title, date, type, isAllDay, isArchived, syncStatus` |

---

## 2. Table Details

### `wallets`
Stores financial accounts/wallets.
- **id** (PK): String (NanoID)
- **title**: String
- **isMain**: Boolean (Indexed) - Marks the primary wallet.
- **isArchived**: Boolean
- **syncStatus**: `created` | `updated` | `synced`
- **createdAt**: Date
- **updatedAt**: Date

### `finance`
Stores financial transactions associated with a wallet.
- **id** (PK): String (NanoID)
- **walletId**: String (FK -> wallets.id)
- **type**: String (`income` | `expense`)
- **category**: String
- **date**: Date
- **amount**: Number
- **syncStatus**: String
- **createdAt**: Date
- **updatedAt**: Date
- *Non-Indexed Field*: `description`, `linkedTransactionId`, `linkedWalletId`, `lastVisitedAt`

### `budgets`
Stores budget goals.
- **id** (PK): String (NanoID)
- **title**: String
- **period**: String (`weekly` | `monthly` | `yearly`)
- **targetAmount**: Number (Non-indexed)
- **isArchived**: Boolean
- **syncStatus**: String
- **createdAt**: Date
- **updatedAt**: Date

### `budgetAssignments`
Junction table linking accumulated transactions to a budget.
- **id** (PK): String
- **budgetId**: String (FK -> budgets.id)
- **transactionId**: String (FK -> finance.id)
- **Compound Index**: `[budgetId+transactionId]` (Unique constraint)
- **syncStatus**: String
- **createdAt**: Date

### `pages`
Stores note pages in a hierarchy.
- **id** (PK): String
- **title**: String
- **parentId**: String (Nullable, FK -> pages.id)
- **isArchived**: Boolean
- **syncStatus**: String
- **createdAt**: Date
- **updatedAt**: Date
- *Non-Indexed Field*: `content` (JSON), `isFavorite`, `lastVisitedAt`

### `blocks`
Stores content blocks for pages (if using block-based editor).
- **id** (PK): String
- **pageId**: String (FK -> pages.id)
- **type**: String (`text`, `heading`, `list`, etc.)
- **order**: Number
- **syncStatus**: String
- **createdAt**: Date
- **updatedAt**: Date
- *Non-Indexed Field*: `content` (Text/HTML)

### `schedules`
Stores calendar events.
- **id** (PK): String
- **title**: String
- **date**: Date
- **type**: String (`event`, `task`, `reminder`)
- **isAllDay**: Boolean
- **isArchived**: Boolean
- **syncStatus**: String
- **createdAt**: Date
- **updatedAt**: Date
- *Non-Indexed Field*: `description`, `location`
