# Function_Appwrite.md - Delta Setup Guide

This guide covers only the newly added backend changes (functions, monthly reports collection, and backup bucket support).

If you already apply infrastructure from `appwrite.json`, most of this is already included. Use this guide when setting up manually in Appwrite Console.

## 1. Newly Added/Required Resources

### 1.1 Collection: monthly_reports

Create collection with ID `monthly_reports` in database `invoiceflow_db`.

Attributes:

- `businessId` (string, size 36, required)
- `month` (string, size 7, required) - format: `YYYY-MM`
- `totalInvoices` (integer, required, default `0`)
- `totalRevenue` (double, required, default `0`)
- `totalTax` (double, required, default `0`)
- `paidCount` (integer, required, default `0`)
- `unpaidCount` (integer, required, default `0`)
- `createdAt` (datetime, optional)

Indexes:

- `business_month_unique_idx` (unique): [`businessId`, `month`] ASC, ASC
- `month_idx` (key): [`month`] ASC

Set `documentSecurity = true` for this collection.

### 1.2 Bucket: backups

Ensure storage bucket with ID `backups` exists:

- Name: `Cloud Backups`
- File Security: enabled
- Encryption: enabled
- Antivirus: enabled
- Allowed extensions: `zip`, `json`
- Max file size: `50000000`

### 1.3 Supporting Collections (must exist)

These are used by the new functions:

- `businesses`
- `invoices`
- `invoice_items`
- `products`
- `subscriptions`
- `customers`
- `backups`
- `notifications`

## 2. Functions to Create/Update

Create these 6 functions in Appwrite Functions.

Common settings:

- Runtime: `node-20.0`
- Entrypoint: `src/main.js`
- Install command: `npm install`

Function matrix:

| Function ID                | Name                     | Execute | Trigger                                                                  | Timeout |
| -------------------------- | ------------------------ | ------- | ------------------------------------------------------------------------ | ------- |
| `monthly-report-generator` | Monthly Report Generator | `any`   | Cron `0 1 1 * *`                                                         | 60s     |
| `analytics-calculator`     | Analytics Calculator     | `any`   | Cron `0 2 * * *`                                                         | 60s     |
| `stock-deduction`          | Stock Deduction          | `users` | Event `databases.invoiceflow_db.collections.invoices.documents.*.create` | 30s     |
| `subscription-validator`   | Subscription Validator   | `users` | HTTP/manual execution                                                    | 60s     |
| `backup-creator`           | Backup Creator           | `users` | HTTP/manual execution                                                    | 120s    |
| `cleanup-old-data`         | Cleanup Old Data         | `any`   | Cron `0 3 * * 0`                                                         | 120s    |

If deploying from local source, use these folders:

- `appwrite/functions/monthly-report-generator`
- `appwrite/functions/analytics-calculator`
- `appwrite/functions/stock-deduction`
- `appwrite/functions/subscription-validator`
- `appwrite/functions/backup-creator`
- `appwrite/functions/cleanup-old-data`

## 3. Environment Variables for Functions

Add these in each function settings (Appwrite Console -> Functions -> [Function] -> Settings -> Variables).

### 3.1 Common Variables (all functions)

- `APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID=699988ac001cd0857f48`
- `APPWRITE_API_KEY=<server_api_key>`
- `APPWRITE_DB_ID=invoiceflow_db`

### 3.2 Function-specific Variables

#### monthly-report-generator

- `COLLECTION_BUSINESSES=businesses`
- `COLLECTION_INVOICES=invoices`
- `COLLECTION_MONTHLY_REPORTS=monthly_reports`

#### analytics-calculator

- `COLLECTION_BUSINESSES=businesses`
- `COLLECTION_INVOICES=invoices`
- `COLLECTION_INVOICE_ITEMS=invoice_items`

#### stock-deduction

- `COLLECTION_PRODUCTS=products`
- `COLLECTION_NOTIFICATIONS=notifications`

#### subscription-validator

- `COLLECTION_SUBSCRIPTIONS=subscriptions`
- `STRICT_RECEIPT_VALIDATION=false`
- `APPLE_SHARED_SECRET=` (required only if `STRICT_RECEIPT_VALIDATION=true` for iOS)

#### backup-creator

- `COLLECTION_CUSTOMERS=customers`
- `COLLECTION_PRODUCTS=products`
- `COLLECTION_INVOICES=invoices`
- `COLLECTION_BACKUPS=backups`
- `BUCKET_BACKUPS=backups`

#### cleanup-old-data

- `COLLECTION_NOTIFICATIONS=notifications`
- `COLLECTION_BACKUPS=backups`
- `BUCKET_BACKUPS=backups`
- `BACKUPS_RETENTION_DAYS=90`
- `NOTIFICATIONS_RETENTION_DAYS=30`

## 4. API Key Requirements

`APPWRITE_API_KEY` should be a server key with at least:

- `databases.read`
- `databases.write`
- `files.read`
- `files.write`

Use a dedicated key for functions and rotate it periodically.

## 5. App-side ENV Sync (recommended)

To keep app IDs aligned with function IDs and collection IDs, set these in your app env if you override defaults:

- `EXPO_PUBLIC_FUNC_MONTHLY_REPORT_GENERATOR`
- `EXPO_PUBLIC_FUNC_ANALYTICS_CALCULATOR`
- `EXPO_PUBLIC_FUNC_STOCK_DEDUCTION`
- `EXPO_PUBLIC_FUNC_SUBSCRIPTION_VALIDATOR`
- `EXPO_PUBLIC_FUNC_BACKUP_CREATOR`
- `EXPO_PUBLIC_FUNC_CLEANUP_OLD_DATA`
- `EXPO_PUBLIC_COL_MONTHLY_REPORTS`
- `EXPO_PUBLIC_BUCKET_BACKUPS`

## 6. Smoke Test Checklist

1. Run `subscription-validator` manually with test payload and verify document in `subscriptions`.
2. Run `backup-creator` manually and verify:
   - document in `backups`
   - zip file in bucket `backups`
3. Trigger invoice creation and verify `stock-deduction` updates product stock.
4. Run `monthly-report-generator` manually once and confirm documents in `monthly_reports`.
5. Run `cleanup-old-data` manually and verify only old data is removed.

---

Source of truth for these values:

- `appwrite.json`
- `appwrite/functions/*/src/main.js`
- `src/services/appwrite.ts`
