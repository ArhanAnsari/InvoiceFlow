# APPWRITE.md — InvoiceFlow: Complete Appwrite Setup Guide

> **Version:** 2.0 | **Last Updated:** February 2026  
> **Stack:** Appwrite Cloud / Self-Hosted v1.5+ · React Native · Expo · TypeScript

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Create Appwrite Project](#3-create-appwrite-project)
4. [Enable Authentication](#4-enable-authentication)
5. [Create the Database](#5-create-the-database)
6. [Create Collections & Schemas](#6-create-collections--schemas)
7. [Set Document Permissions](#7-set-document-permissions)
8. [Create Storage Buckets](#8-create-storage-buckets)
9. [Create Appwrite Functions](#9-create-appwrite-functions)
10. [Environment Variables](#10-environment-variables)
11. [Connect React Native to Appwrite](#11-connect-react-native-to-appwrite)
12. [Realtime Subscriptions](#12-realtime-subscriptions)
13. [Test Your Setup](#13-test-your-setup)
14. [Security Best Practices](#14-security-best-practices)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Introduction

InvoiceFlow uses **Appwrite** as its cloud backend to provide:

- **Authentication** — Email/Password and Phone OTP login
- **Database** — Multi-tenant, permission-controlled document storage
- **Storage** — Business logos, invoice PDFs, signatures
- **Functions** — Monthly reports, analytics, stock deduction, subscription validation
- **Realtime** — Live invoice status updates across devices

This guide covers both **Appwrite Cloud** (recommended for production) and **self-hosted** setups.

---

## 2. Prerequisites

### Software Requirements

| Tool         | Version | Notes                          |
| ------------ | ------- | ------------------------------ |
| Node.js      | 20+     | For Appwrite CLI and Functions |
| npm / yarn   | latest  |                                |
| Appwrite CLI | 6.0+    | `npm i -g appwrite-cli`        |
| Expo CLI     | 6+      | `npm i -g expo-cli`            |
| Docker       | 24+     | **Self-hosted only**           |

### Accounts Required

- [Appwrite Cloud](https://cloud.appwrite.io) account (free tier available)  
  **OR** a server with Docker for self-hosted deployment
- Apple Developer Account (for iOS OTP & In-App Purchases)
- Google Play Console (for Android)

### Install Appwrite CLI

```bash
npm install -g appwrite-cli
appwrite --version   # verify: should print 6.x.x
```

---

## 3. Create Appwrite Project

### Option A — Appwrite Cloud (Recommended)

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) and sign in.
2. Click **"Create Project"**.
3. Name it: `InvoiceFlow`
4. Select your nearest **region** (Frankfurt, New York, Sydney, etc.).
5. Click **"Create"**.
6. Copy your **Project ID** from the top of the project dashboard — you will need it later.

### Option B — Self-Hosted (Docker)

```bash
# Download and run Appwrite
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.5.11

# Access the console at http://localhost/console
```

Set your domain or use `localhost` during setup. Then follow the same UI steps as Option A.

### CLI Login

```bash
appwrite login
# Enter: https://cloud.appwrite.io/v1  (or your self-hosted URL)
# Enter your email and password
```

---

## 4. Enable Authentication

### 4.1 Email / Password Auth

1. Open your Appwrite project → **Auth** → **Settings**.
2. Under **Auth Methods**, enable **Email/Password**.
3. Set:
   - **Session Length**: 365 days (for persistent mobile sessions)
   - **Password Minimum Length**: 8
   - **Password History**: 3 (prevent reuse)

### 4.2 Phone OTP Auth

1. Under **Auth Methods**, enable **Phone (SMS)**.
2. Configure an **SMS Provider**:
   - Go to **Messaging** → **Providers** → **Add Provider** → **SMS**
   - Recommended: **Twilio** or **MSG91** (India)

**Twilio Setup:**

```
Account SID:  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:   your_auth_token
From Number:  +1XXXXXXXXXX
```

**MSG91 Setup (India):**

```
API Key:         your_msg91_api_key
Sender ID:       INVFLW
Template ID:     your_dlt_template_id
```

3. Set OTP expiry to **10 minutes**.
4. Enable **rate limiting**: max 3 OTP requests per phone per hour.

### 4.3 OAuth Providers (Optional — Future)

1. Enable **Google OAuth** for optional social login.
2. Add your `redirect_uri` as: `invoiceflow://oauth`
3. Add the redirect URI in your Google Cloud Console credentials.

### 4.4 Email Verification

1. In **Auth → Templates**, customize the verification email:
   - Subject: `Verify your InvoiceFlow account`
   - Add your business logo URL in the template.

---

## 5. Create the Database

1. In Appwrite Console → **Databases** → **Create Database**.
2. Set:
   - **Name**: `InvoiceFlow DB`
   - **Database ID**: `invoiceflow_db` _(custom ID — important!)_
3. Click **Create**.

> Using a custom Database ID means you never need to hardcode auto-generated IDs.

---

## 6. Create Collections & Schemas

For each collection below, go to **Databases → InvoiceFlow DB → Create Collection**.  
Set the **Collection ID** exactly as shown (lowercase with underscores).

---

### 6.1 Collection: `businesses`

**Collection ID:** `businesses`

| Attribute         | Type    | Size | Required | Default | Notes                   |
| ----------------- | ------- | ---- | -------- | ------- | ----------------------- |
| `ownerId`         | String  | 36   | ✅       | —       | Appwrite User $id       |
| `name`            | String  | 255  | ✅       | —       | Business display name   |
| `gstin`           | String  | 15   | ❌       | —       | Indian GSTIN number     |
| `pan`             | String  | 10   | ❌       | —       | PAN number              |
| `address`         | String  | 1000 | ❌       | —       | Full address            |
| `city`            | String  | 100  | ❌       | —       |                         |
| `state`           | String  | 100  | ❌       | —       |                         |
| `pincode`         | String  | 10   | ❌       | —       |                         |
| `phone`           | String  | 20   | ❌       | —       | Business phone          |
| `email`           | String  | 255  | ❌       | —       | Business email          |
| `website`         | String  | 255  | ❌       | —       |                         |
| `logoFileId`      | String  | 36   | ❌       | —       | Storage file ID         |
| `signatureFileId` | String  | 36   | ❌       | —       | Signature image         |
| `currency`        | String  | 5    | ✅       | `INR`   | ISO currency code       |
| `currencySymbol`  | String  | 5    | ✅       | `₹`     |                         |
| `planType`        | String  | 20   | ✅       | `free`  | free / pro / enterprise |
| `planExpiresAt`   | String  | 30   | ❌       | —       | ISO timestamp           |
| `invoicePrefix`   | String  | 20   | ✅       | `INV`   | e.g. "INV", "BILL"      |
| `invoiceCounter`  | Integer | —    | ✅       | 0       | Auto-incremented        |
| `taxType`         | String  | 10   | ✅       | `gst`   | gst / vat / none        |
| `isActive`        | Boolean | —    | ✅       | true    | Soft delete flag        |

**Indexes:**

- `ownerId_idx` → `ownerId` (Key)
- `planType_idx` → `planType` (Key)

---

### 6.2 Collection: `customers`

**Collection ID:** `customers`

| Attribute        | Type     | Size | Required | Default | Notes                    |
| ---------------- | -------- | ---- | -------- | ------- | ------------------------ |
| `businessId`     | String   | 36   | ✅       | —       | Parent business          |
| `name`           | String   | 255  | ✅       | —       |                          |
| `phone`          | String   | 20   | ❌       | —       |                          |
| `email`          | String   | 255  | ❌       | —       |                          |
| `gstin`          | String   | 15   | ❌       | —       | Customer GST             |
| `address`        | String   | 1000 | ❌       | —       |                          |
| `city`           | String   | 100  | ❌       | —       |                          |
| `state`          | String   | 100  | ❌       | —       | For IGST calculation     |
| `pincode`        | String   | 10   | ❌       | —       |                          |
| `balance`        | Float    | —    | ✅       | `0`     | Running balance          |
| `totalPurchases` | Float    | —    | ✅       | `0`     | Lifetime spend           |
| `totalInvoices`  | Integer  | —    | ✅       | `0`     | Invoice count            |
| `tags`           | String[] | 50   | ❌       | —       | e.g. ["vip","wholesale"] |
| `notes`          | String   | 2000 | ❌       | —       |                          |
| `isActive`       | Boolean  | —    | ✅       | true    |                          |

**Indexes:**

- `businessId_idx` → `businessId` (Key)
- `phone_idx` → `phone` (Fulltext)
- `name_idx` → `name` (Fulltext)

---

### 6.3 Collection: `products`

**Collection ID:** `products`

| Attribute           | Type    | Size | Required | Default | Notes                 |
| ------------------- | ------- | ---- | -------- | ------- | --------------------- |
| `businessId`        | String  | 36   | ✅       | —       |                       |
| `name`              | String  | 255  | ✅       | —       |                       |
| `description`       | String  | 1000 | ❌       | —       |                       |
| `sku`               | String  | 100  | ❌       | —       | Stock Keeping Unit    |
| `barcode`           | String  | 100  | ❌       | —       |                       |
| `category`          | String  | 100  | ❌       | —       |                       |
| `unit`              | String  | 50   | ✅       | `pcs`   | pcs / kg / ltr / mtr  |
| `price`             | Float   | —    | ✅       | —       | Selling price         |
| `costPrice`         | Float   | —    | ❌       | `0`     | Purchase price        |
| `mrp`               | Float   | —    | ❌       | —       | Max retail price      |
| `taxRate`           | Float   | —    | ✅       | `0`     | e.g. 18.0 for 18% GST |
| `hsnCode`           | String  | 20   | ❌       | —       | HSN/SAC code          |
| `stock`             | Integer | —    | ✅       | `0`     | Current stock         |
| `lowStockThreshold` | Integer | —    | ✅       | `5`     | Alert trigger         |
| `imageFileId`       | String  | 36   | ❌       | —       | Product image         |
| `isService`         | Boolean | —    | ✅       | false   | Product vs service    |
| `isActive`          | Boolean | —    | ✅       | true    |                       |

**Indexes:**

- `businessId_idx` → `businessId` (Key)
- `sku_idx` → `sku` (Unique, sparse)
- `name_idx` → `name` (Fulltext)
- `category_idx` → `category` (Key)

---

### 6.4 Collection: `invoices`

**Collection ID:** `invoices`

| Attribute           | Type    | Size  | Required | Default  | Notes                         |
| ------------------- | ------- | ----- | -------- | -------- | ----------------------------- |
| `businessId`        | String  | 36    | ✅       | —        |                               |
| `customerId`        | String  | 36    | ✅       | —        |                               |
| `customerName`      | String  | 255   | ✅       | —        | Denormalized                  |
| `customerPhone`     | String  | 20    | ❌       | —        | Denormalized                  |
| `customerGstin`     | String  | 15    | ❌       | —        |                               |
| `invoiceNumber`     | String  | 50    | ✅       | —        | e.g. "INV-2026-001"           |
| `invoiceDate`       | String  | 30    | ✅       | —        | ISO date string               |
| `dueDate`           | String  | 30    | ❌       | —        |                               |
| `items`             | String  | 50000 | ✅       | —        | JSON array of items           |
| `subTotal`          | Float   | —     | ✅       | —        | Pre-tax total                 |
| `discountType`      | String  | 20    | ❌       | `none`   | flat / percent / none         |
| `discountValue`     | Float   | —     | ✅       | `0`      |                               |
| `discountAmount`    | Float   | —     | ✅       | `0`      | Calculated                    |
| `cgstAmount`        | Float   | —     | ✅       | `0`      | Central GST                   |
| `sgstAmount`        | Float   | —     | ✅       | `0`      | State GST                     |
| `igstAmount`        | Float   | —     | ✅       | `0`      | Integrated GST                |
| `totalTax`          | Float   | —     | ✅       | `0`      |                               |
| `totalAmount`       | Float   | —     | ✅       | —        | Final payable amount          |
| `paidAmount`        | Float   | —     | ✅       | `0`      |                               |
| `balanceDue`        | Float   | —     | ✅       | —        | totalAmount - paidAmount      |
| `status`            | String  | 20    | ✅       | `unpaid` | unpaid/partial/paid/cancelled |
| `paymentMethod`     | String  | 30    | ❌       | —        | cash/upi/card/bank            |
| `paymentDate`       | String  | 30    | ❌       | —        |                               |
| `notes`             | String  | 2000  | ❌       | —        |                               |
| `termsConditions`   | String  | 5000  | ❌       | —        |                               |
| `pdfFileId`         | String  | 36    | ❌       | —        | Generated PDF                 |
| `isRecurring`       | Boolean | —     | ✅       | false    |                               |
| `recurringInterval` | String  | 20    | ❌       | —        | monthly/quarterly             |
| `staffId`           | String  | 36    | ❌       | —        | Created by                    |

**Indexes:**

- `businessId_idx` → `businessId` (Key)
- `customerId_idx` → `customerId` (Key)
- `status_idx` → `status` (Key)
- `invoiceNumber_idx` → `invoiceNumber` (Unique)
- `invoiceDate_idx` → `invoiceDate` (Key)

---

### 6.5 Collection: `invoice_items`

> **Note:** For small invoices, items are stored as JSON in the `invoices` collection. This separate collection is used for analytics queries on large datasets.

**Collection ID:** `invoice_items`

| Attribute     | Type   | Size | Required | Notes                      |
| ------------- | ------ | ---- | -------- | -------------------------- |
| `invoiceId`   | String | 36   | ✅       | Parent invoice             |
| `businessId`  | String | 36   | ✅       |                            |
| `productId`   | String | 36   | ✅       |                            |
| `productName` | String | 255  | ✅       | Denormalized               |
| `hsnCode`     | String | 20   | ❌       |                            |
| `quantity`    | Float  | —    | ✅       |                            |
| `unit`        | String | 50   | ✅       |                            |
| `price`       | Float  | —    | ✅       | Unit price at time of sale |
| `taxRate`     | Float  | —    | ✅       |                            |
| `taxAmount`   | Float  | —    | ✅       |                            |
| `totalPrice`  | Float  | —    | ✅       |                            |

**Indexes:**

- `invoiceId_idx` → `invoiceId` (Key)
- `productId_idx` → `productId` (Key)
- `businessId_idx` → `businessId` (Key)

---

### 6.6 Collection: `subscriptions`

**Collection ID:** `subscriptions`

| Attribute            | Type    | Size | Required | Notes                                |
| -------------------- | ------- | ---- | -------- | ------------------------------------ |
| `userId`             | String  | 36   | ✅       | Appwrite user ID                     |
| `businessId`         | String  | 36   | ✅       |                                      |
| `planType`           | String  | 20   | ✅       | free / pro / enterprise              |
| `status`             | String  | 20   | ✅       | active / expired / cancelled / trial |
| `startDate`          | String  | 30   | ✅       | ISO date                             |
| `endDate`            | String  | 30   | ✅       | ISO date                             |
| `trialEndDate`       | String  | 30   | ❌       |                                      |
| `platform`           | String  | 20   | ✅       | ios / android / web                  |
| `storeProductId`     | String  | 100  | ❌       | App Store / Play Store product ID    |
| `storeTransactionId` | String  | 255  | ❌       | Receipt/transaction ID               |
| `autoRenew`          | Boolean | —    | ✅       | true                                 |
| `cancelReason`       | String  | 500  | ❌       |                                      |

**Indexes:**

- `userId_idx` → `userId` (Key)
- `businessId_idx` → `businessId` (Unique)
- `status_idx` → `status` (Key)

---

### 6.7 Collection: `staff_roles`

**Collection ID:** `staff_roles`

| Attribute         | Type     | Size | Required | Notes                                  |
| ----------------- | -------- | ---- | -------- | -------------------------------------- |
| `businessId`      | String   | 36   | ✅       |                                        |
| `userId`          | String   | 36   | ✅       | Appwrite user ID of staff              |
| `role`            | String   | 30   | ✅       | owner / manager / staff / viewer       |
| `permissions`     | String[] | 50   | ✅       | e.g. ["create_invoice","view_reports"] |
| `invitedByUserId` | String   | 36   | ❌       |                                        |
| `inviteEmail`     | String   | 255  | ❌       |                                        |
| `inviteStatus`    | String   | 20   | ✅       | pending / accepted / rejected          |
| `isActive`        | Boolean  | —    | ✅       | true                                   |

**Permissions List (all possible values):**

```
create_invoice    view_invoices     edit_invoices     delete_invoices
create_customer   view_customers    edit_customers    delete_customers
create_product    view_products     edit_products     delete_products
view_reports      manage_staff      manage_settings   manage_subscription
```

**Indexes:**

- `businessId_userId_idx` → `businessId + userId` (Unique compound)
- `businessId_idx` → `businessId` (Key)

---

### 6.8 Collection: `backups`

**Collection ID:** `backups`

| Attribute       | Type    | Size | Required | Notes                                |
| --------------- | ------- | ---- | -------- | ------------------------------------ |
| `businessId`    | String  | 36   | ✅       |                                      |
| `userId`        | String  | 36   | ✅       | Triggered by                         |
| `fileId`        | String  | 36   | ✅       | Storage file ID of backup ZIP        |
| `fileName`      | String  | 255  | ✅       | e.g. "backup_2026-02-24.zip"         |
| `fileSizeBytes` | Integer | —    | ✅       |                                      |
| `status`        | String  | 20   | ✅       | pending / completed / failed         |
| `type`          | String  | 20   | ✅       | manual / scheduled                   |
| `recordCounts`  | String  | 1000 | ❌       | JSON: {customers: 50, invoices: 200} |

---

### 6.9 Collection: `notifications`

**Collection ID:** `notifications`

| Attribute    | Type    | Size | Required | Notes                                            |
| ------------ | ------- | ---- | -------- | ------------------------------------------------ |
| `userId`     | String  | 36   | ✅       |                                                  |
| `businessId` | String  | 36   | ✅       |                                                  |
| `type`       | String  | 50   | ✅       | payment_received / low_stock / invoice_due / etc |
| `title`      | String  | 255  | ✅       |                                                  |
| `body`       | String  | 1000 | ✅       |                                                  |
| `data`       | String  | 2000 | ❌       | JSON payload for deep link                       |
| `isRead`     | Boolean | —    | ✅       | false                                            |
| `readAt`     | String  | 30   | ❌       |                                                  |

---

## 7. Set Document Permissions

Appwrite uses **document-level security** via permission strings. Configure each collection using the following rules.

### Permission Strategy

InvoiceFlow uses a **user-scoped multi-tenant** model. Each document is owned by a user and visible only to that user (or their staff).

### Collection Permission Templates

#### businesses, customers, products, invoices (User-owned)

Set **Collection Permissions**:

| Permission | Value           | Notes                  |
| ---------- | --------------- | ---------------------- |
| Read       | `user:{userId}` | Only the owner reads   |
| Create     | `user:{userId}` | Only the owner creates |
| Update     | `user:{userId}` | Only the owner updates |
| Delete     | `user:{userId}` | Only the owner deletes |

> These are set **at document creation time** in your app code, not on the collection itself. Set the collection to use **Document Security** (toggle it ON in collection settings).

#### staff_roles

- Collection-level: **No default permissions**
- Document-level at creation: allow `read` for both owner AND staff user IDs:

```typescript
// When inviting staff:
await databases.createDocument(
  DB_ID,
  "staff_roles",
  ID.unique(),
  { ...staffData },
  [
    Permission.read(Role.user(ownerId)),
    Permission.write(Role.user(ownerId)),
    Permission.read(Role.user(staffUserId)), // Staff can read their own role
  ],
);
```

#### subscriptions

- Read/Write: Only `user:{userId}`
- Functions can update subscription status using the **Appwrite API Key** (server-side).

### Enabling Document Security

For each collection:

1. Open collection → **Settings** tab
2. Toggle **Document Security** → **ON**
3. Set default collection permissions to **none** (all permissions controlled per document)

---

## 8. Create Storage Buckets

Go to **Databases → Storage → Create Bucket** (or **Storage** in sidebar).

### 8.1 Bucket: `business_assets`

| Setting            | Value                       |
| ------------------ | --------------------------- |
| Bucket ID          | `business_assets`           |
| Name               | Business Assets             |
| Max File Size      | 5 MB                        |
| Allowed Extensions | `jpg, jpeg, png, webp, svg` |
| Compression        | `gzip`                      |
| Encryption         | ✅ Enabled                  |
| Antivirus          | ✅ Enabled (if available)   |

**Permissions:**

- Read: `users` (authenticated users only — for logo display in PDFs)
- Write: per-user at upload time

### 8.2 Bucket: `invoice_pdfs`

| Setting            | Value          |
| ------------------ | -------------- |
| Bucket ID          | `invoice_pdfs` |
| Name               | Invoice PDFs   |
| Max File Size      | 10 MB          |
| Allowed Extensions | `pdf`          |
| Compression        | `none`         |
| Encryption         | ✅ Enabled     |

**Permissions:**

- Read/Write: per-user at upload time

### 8.3 Bucket: `backups`

| Setting            | Value         |
| ------------------ | ------------- |
| Bucket ID          | `backups`     |
| Name               | Cloud Backups |
| Max File Size      | 50 MB         |
| Allowed Extensions | `zip, json`   |
| Encryption         | ✅ Enabled    |

**Permissions:**

- Read/Write: per-user (owner only)

---

## 9. Create Appwrite Functions

Go to **Functions** → **Create Function**. Use the **Node.js 20** runtime for all functions.

### 9.1 Function: `monthly-report-generator`

**Purpose:** Aggregates invoices for a business over a given month and stores a report summary document.

**Trigger:** CRON — `0 1 1 * *` (1 AM on the 1st of every month)

**Environment Variables:**

```
APPWRITE_API_KEY=your_server_api_key
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

**Function Source** (`src/main.js`):

```javascript
import { Client, Databases, Query, ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const DB_ID = "invoiceflow_db";

  const now = new Date();
  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  ).toISOString();
  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
  ).toISOString();

  log(`Generating monthly reports for ${firstDay} to ${lastDay}`);

  // Fetch all businesses
  const businesses = await db.listDocuments(DB_ID, "businesses", [
    Query.equal("isActive", true),
    Query.limit(500),
  ]);

  for (const biz of businesses.documents) {
    const invoices = await db.listDocuments(DB_ID, "invoices", [
      Query.equal("businessId", biz.$id),
      Query.greaterThanEqual("invoiceDate", firstDay),
      Query.lessThanEqual("invoiceDate", lastDay),
      Query.limit(1000),
    ]);

    const totalRevenue = invoices.documents.reduce(
      (s, i) => s + i.totalAmount,
      0,
    );
    const totalTax = invoices.documents.reduce((s, i) => s + i.totalTax, 0);
    const totalPaid = invoices.documents.filter(
      (i) => i.status === "paid",
    ).length;
    const totalUnpaid = invoices.documents.filter(
      (i) => i.status === "unpaid",
    ).length;

    await db.createDocument(
      DB_ID,
      "monthly_reports",
      ID.unique(),
      {
        businessId: biz.$id,
        month: firstDay.slice(0, 7),
        totalInvoices: invoices.total,
        totalRevenue,
        totalTax,
        paidCount: totalPaid,
        unpaidCount: totalUnpaid,
      },
      [`read("user:${biz.ownerId}")`, `write("user:${biz.ownerId}")`],
    );

    log(`Report created for business: ${biz.name}`);
  }

  return res.json({ ok: true, processed: businesses.total });
};
```

---

### 9.2 Function: `analytics-calculator`

**Purpose:** Calculates top customers, top products, and revenue trends for a business.

**Trigger:** HTTP (called from app) + CRON `0 2 * * *` (daily at 2 AM)

**Key Logic:**

```javascript
// Top products by quantity sold (via invoice_items)
const items = await db.listDocuments(DB_ID, "invoice_items", [
  Query.equal("businessId", businessId),
  Query.greaterThanEqual("$createdAt", thirtyDaysAgo),
  Query.limit(5000),
  Query.orderDesc("quantity"),
]);

// Aggregate by productId
const productMap = {};
for (const item of items.documents) {
  productMap[item.productId] =
    (productMap[item.productId] || 0) + item.quantity;
}
const topProducts = Object.entries(productMap)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10);
```

---

### 9.3 Function: `stock-deduction`

**Purpose:** Automatically deducts product stock when an invoice is marked as paid/created.

**Trigger:** Appwrite Database Event — `databases.invoiceflow_db.collections.invoices.documents.*.create`

```javascript
export default async ({ req, res, log }) => {
  const invoice = JSON.parse(req.body);
  const items = JSON.parse(invoice.items);

  for (const item of items) {
    const product = await db.getDocument(DB_ID, "products", item.productId);
    const newStock = Math.max(0, product.stock - item.quantity);

    await db.updateDocument(DB_ID, "products", item.productId, {
      stock: newStock,
    });

    // Create low-stock notification if needed
    if (newStock <= product.lowStockThreshold) {
      await db.createDocument(DB_ID, "notifications", ID.unique(), {
        userId: invoice.staffId || invoice.ownerId,
        businessId: invoice.businessId,
        type: "low_stock",
        title: `Low Stock Alert`,
        body: `${product.name} is running low (${newStock} ${product.unit} left)`,
        isRead: false,
      });
    }
  }

  return res.json({ ok: true });
};
```

---

### 9.4 Function: `subscription-validator`

**Purpose:** Validates iOS/Android In-App Purchase receipts and activates/updates subscription in Appwrite DB.

**Trigger:** HTTP POST (called from app after purchase)

**Request Body:**

```json
{
  "userId": "user_id",
  "businessId": "business_id",
  "platform": "ios",
  "productId": "com.invoiceflow.pro_monthly",
  "receipt": "BASE64_ENCODED_RECEIPT_OR_TOKEN"
}
```

**Key Logic:**

```javascript
// iOS: Validate with Apple
const appleResponse = await fetch(
  "https://buy.itunes.apple.com/verifyReceipt",
  {
    method: "POST",
    body: JSON.stringify({
      "receipt-data": receipt,
      password: process.env.APPLE_SHARED_SECRET,
      "exclude-old-transactions": true,
    }),
  },
);

// Android: Validate with Google Play API
// Uses googleapis package with service account credentials
```

---

### 9.5 Function: `backup-creator`

**Purpose:** Exports all business data to a JSON file and uploads to the `backups` storage bucket.

**Trigger:** HTTP POST (triggered manually by user from app)

**Process:**

1. Fetch all customers, products, invoices for `businessId`
2. Serialize to JSON
3. Create a ZIP file using `jszip`
4. Upload to `backups` bucket using Appwrite Storage
5. Create a record in `backups` collection
6. Return the file download URL

---

### 9.6 Function: `cleanup-old-data`

**Purpose:** Removes orphaned data, expired sessions, and old soft-deleted records.

**Trigger:** CRON `0 3 * * 0` (every Sunday at 3 AM)

**Actions:**

- Delete `backups` older than 90 days
- Remove `notifications` older than 30 days that are read
- Clean up `sync_queue` orphaned entries (if applicable)

---

## 10. Environment Variables

Create a `.env` file in the root of your Expo project. **Never commit this file to Git.**

Add `.env` to `.gitignore`:

```ini
# in .gitignore
.env
.env.local
.env.*.local
```

### `.env` File

```ini
# ─── Appwrite Core ─────────────────────────────────────────────────
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID_HERE
EXPO_PUBLIC_APPWRITE_DB_ID=invoiceflow_db

# ─── Appwrite Storage Bucket IDs ───────────────────────────────────
EXPO_PUBLIC_BUCKET_BUSINESS_ASSETS=business_assets
EXPO_PUBLIC_BUCKET_INVOICE_PDFS=invoice_pdfs
EXPO_PUBLIC_BUCKET_BACKUPS=backups

# ─── Appwrite Collection IDs ────────────────────────────────────────
EXPO_PUBLIC_COL_BUSINESSES=businesses
EXPO_PUBLIC_COL_CUSTOMERS=customers
EXPO_PUBLIC_COL_PRODUCTS=products
EXPO_PUBLIC_COL_INVOICES=invoices
EXPO_PUBLIC_COL_INVOICE_ITEMS=invoice_items
EXPO_PUBLIC_COL_SUBSCRIPTIONS=subscriptions
EXPO_PUBLIC_COL_STAFF_ROLES=staff_roles
EXPO_PUBLIC_COL_BACKUPS=backups
EXPO_PUBLIC_COL_NOTIFICATIONS=notifications

# ─── App Config ─────────────────────────────────────────────────────
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=2.0.0

# ─── Server-side only (Appwrite Functions) ──────────────────────────
# These are set in the Functions environment, NOT in the React Native app
APPWRITE_API_KEY=your_server_api_key_NEVER_EXPOSE_IN_APP
APPLE_SHARED_SECRET=your_apple_shared_secret
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Using Environment Variables in Code

```typescript
// src/services/appwrite.ts
export const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
export const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID!;

export const COLLECTIONS = {
  BUSINESSES: process.env.EXPO_PUBLIC_COL_BUSINESSES!,
  CUSTOMERS: process.env.EXPO_PUBLIC_COL_CUSTOMERS!,
  PRODUCTS: process.env.EXPO_PUBLIC_COL_PRODUCTS!,
  INVOICES: process.env.EXPO_PUBLIC_COL_INVOICES!,
  INVOICE_ITEMS: process.env.EXPO_PUBLIC_COL_INVOICE_ITEMS!,
  SUBSCRIPTIONS: process.env.EXPO_PUBLIC_COL_SUBSCRIPTIONS!,
  STAFF_ROLES: process.env.EXPO_PUBLIC_COL_STAFF_ROLES!,
  BACKUPS: process.env.EXPO_PUBLIC_COL_BACKUPS!,
  NOTIFICATIONS: process.env.EXPO_PUBLIC_COL_NOTIFICATIONS!,
};

export const BUCKETS = {
  BUSINESS_ASSETS: process.env.EXPO_PUBLIC_BUCKET_BUSINESS_ASSETS!,
  INVOICE_PDFS: process.env.EXPO_PUBLIC_BUCKET_INVOICE_PDFS!,
  BACKUPS: process.env.EXPO_PUBLIC_BUCKET_BACKUPS!,
};
```

---

## 11. Connect React Native to Appwrite

### 11.1 Install the SDK

```bash
npx expo install appwrite
```

> **Important:** Use the `appwrite` package (not `react-native-appwrite`) with Expo SDK 54+. The standard web SDK works with Expo's bundler.

### 11.2 Configure the Client

```typescript
// src/services/appwrite.ts
import {
  Account,
  Client,
  Databases,
  Functions,
  Realtime,
  Storage,
  ID,
  Query,
  Permission,
  Role,
} from "appwrite";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

export { client, ID, Query, Permission, Role };
```

### 11.3 Add Platform (Expo / React Native)

In Appwrite Console → **Project Settings** → **Platforms** → **Add Platform**:

**For iOS:**

- Type: Apple iOS
- Bundle ID: `com.yourcompany.invoiceflow`  
  _(must match your `app.json` → `ios.bundleIdentifier`)_

**For Android:**

- Type: Android
- Package Name: `com.yourcompany.invoiceflow`  
  _(must match your `app.json` → `android.package`)_

**For Web (Expo Go / development):**

- Type: Web
- Hostname: `localhost`

### 11.4 Authentication Flows

#### Email/Password Login

```typescript
// src/services/authService.ts
import { account, ID } from "./appwrite";

export const loginWithEmail = async (email: string, password: string) => {
  return await account.createEmailPasswordSession(email, password);
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
) => {
  await account.create(ID.unique(), email, password, name);
  return await loginWithEmail(email, password);
};

export const getCurrentUser = async () => {
  return await account.get();
};

export const logout = async () => {
  return await account.deleteSession("current");
};

export const logoutAllDevices = async () => {
  return await account.deleteSessions();
};
```

#### Phone OTP Login

```typescript
export const sendOTP = async (phone: string) => {
  // phone must include country code, e.g. "+919876543210"
  const token = await account.createPhoneToken(ID.unique(), phone);
  return token.userId; // Store this temporarily for verification step
};

export const verifyOTP = async (userId: string, otp: string) => {
  return await account.createSession(userId, otp);
};
```

#### Session Persistence

```typescript
// Appwrite SDK automatically persists the session in
// AsyncStorage (React Native) / localStorage (Web).
// On app launch, simply call account.get() to restore the session:

export const checkSession = async () => {
  try {
    return await account.get(); // returns user if session is valid
  } catch {
    return null; // no active session
  }
};
```

### 11.5 CRUD Example — Create a Customer

```typescript
import {
  databases,
  ID,
  Permission,
  Role,
  DB_ID,
  COLLECTIONS,
} from "./appwrite";

export const createCustomer = async (
  businessId: string,
  userId: string,
  data: Omit<Customer, keyof AppwriteDocument>,
) => {
  return await databases.createDocument(
    DB_ID,
    COLLECTIONS.CUSTOMERS,
    ID.unique(),
    { ...data, businessId },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  );
};
```

### 11.6 File Upload — Business Logo

```typescript
import { storage, ID, Permission, Role, BUCKETS } from "./appwrite";
import * as ImagePicker from "expo-image-picker";

export const uploadBusinessLogo = async (userId: string, imageUri: string) => {
  // Convert URI to Blob for Appwrite
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const file = new File([blob], "logo.jpg", { type: "image/jpeg" });

  return await storage.createFile(BUCKETS.BUSINESS_ASSETS, ID.unique(), file, [
    Permission.read(Role.any()), // Public read for PDF generation
    Permission.delete(Role.user(userId)),
  ]);
};

export const getFilePreviewUrl = (bucketId: string, fileId: string) => {
  return storage.getFilePreview(bucketId, fileId, 200, 200);
};
```

---

## 12. Realtime Subscriptions

Appwrite Realtime allows your app to receive live updates without polling.

### Subscribe to Invoice Status Changes

```typescript
import { client, COLLECTIONS, DB_ID } from "./appwrite";

export const subscribeToInvoices = (
  businessId: string,
  onUpdate: (invoice: Invoice) => void,
) => {
  const channel = `databases.${DB_ID}.collections.${COLLECTIONS.INVOICES}.documents`;

  const unsubscribe = client.subscribe(channel, (response) => {
    const invoice = response.payload as Invoice;

    // Filter for this business only
    if (invoice.businessId === businessId) {
      if (
        response.events.includes(`${channel}.*.update`) ||
        response.events.includes(`${channel}.*.create`)
      ) {
        onUpdate(invoice);
      }
    }
  });

  return unsubscribe; // Call this to clean up the subscription
};
```

### React Hook Usage

```typescript
// src/hooks/useRealtimeInvoices.ts
import { useEffect } from "react";
import { subscribeToInvoices } from "../services/realtimeService";
import { useInvoiceStore } from "../store/invoiceStore";

export const useRealtimeInvoices = (businessId: string) => {
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);

  useEffect(() => {
    if (!businessId) return;
    const unsub = subscribeToInvoices(businessId, updateInvoice);
    return () => unsub();
  }, [businessId]);
};
```

---

## 13. Test Your Setup

### 13.1 Smoke Tests (Manual)

Run through this checklist after initial setup:

- [ ] Create a new user account with email/password
- [ ] Verify you can call `account.get()` and get back a user object
- [ ] Create a document in the `businesses` collection
- [ ] Fetch the document back using the same user session
- [ ] Try fetching it with a **different** user — should get a `401` error
- [ ] Upload a file to `business_assets` bucket
- [ ] Retrieve the file preview URL
- [ ] Trigger the `stock-deduction` function manually via the Appwrite console
- [ ] Check that stock was deducted in the `products` collection

### 13.2 Automated Test Script

```typescript
// scripts/test-appwrite.ts
import { Client, Account, Databases, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("YOUR_PROJECT_ID");

const account = new Account(client);
const databases = new Databases(client);

async function runTests() {
  console.log("🧪 Testing Appwrite Setup...\n");

  // Test 1: Create user
  try {
    await account.create(
      ID.unique(),
      `test_${Date.now()}@test.com`,
      "Test@1234!",
      "Test User",
    );
    console.log("✅ User creation: PASS");
  } catch (e: any) {
    console.error("❌ User creation: FAIL —", e.message);
  }

  // Test 2: Login
  try {
    await account.createEmailPasswordSession(
      `test_${Date.now()}@test.com`,
      "Test@1234!",
    );
    console.log("✅ Login: PASS");
  } catch (e: any) {
    console.error("❌ Login: FAIL —", e.message);
  }

  // Test 3: Create document
  try {
    const user = await account.get();
    await databases.createDocument(
      "invoiceflow_db",
      "businesses",
      ID.unique(),
      {
        ownerId: user.$id,
        name: "Test Business",
        planType: "free",
        currency: "INR",
        currencySymbol: "₹",
        invoicePrefix: "INV",
        invoiceCounter: 0,
        taxType: "gst",
        isActive: true,
      },
      [`read("user:${user.$id}")`, `write("user:${user.$id}")`],
    );
    console.log("✅ Document creation: PASS");
  } catch (e: any) {
    console.error("❌ Document creation: FAIL —", e.message);
  }

  console.log("\n🏁 Tests complete.");
}

runTests();
```

Run it:

```bash
npx ts-node scripts/test-appwrite.ts
```

---

## 14. Security Best Practices

### 14.1 Never Expose API Keys in the App

- `EXPO_PUBLIC_*` variables are embedded in the bundle — anyone can extract them.
- Only use these for the **Appwrite Project ID** and **Endpoint** (public, safe).
- **Never** put your Appwrite API Key (server key) in the React Native app.
- Server-side keys belong exclusively in **Appwrite Function environment variables**.

### 14.2 Document-Level Security

Every document creation must include permissions:

```typescript
// ✅ Correct — always include permissions
await databases.createDocument(DB_ID, collection, ID.unique(), data, [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]);

// ❌ Wrong — no permissions means anyone can access it!
await databases.createDocument(DB_ID, collection, ID.unique(), data);
```

### 14.3 Input Validation

- Validate all inputs on the **client side** before sending to Appwrite.
- Use Appwrite's **attribute size limits** (set when creating attributes) as a server-side safeguard.
- Sanitize phone numbers: strip spaces, dashes, ensure `+` prefix for international format.

### 14.4 Rate Limiting

In Appwrite Console → **Auth Settings**:

- Max sessions: 10 (prevent session flooding)
- Failed login attempts: 5 before temporary lock

### 14.5 HTTPS Only

- Always use `https://` endpoints.
- For self-hosted: configure SSL via Let's Encrypt (Appwrite installer does this automatically with a domain).

### 14.6 Encryption

- Appwrite encrypts data at rest by default (Cloud).
- For self-hosted, enable encryption in `.env`: `_APP_OPENSSL_KEY_V1=your_32_char_key`

### 14.7 Audit Logging

- Enable Appwrite's built-in **Activity Logs** in Project Settings.
- For security-critical operations (delete business, change plan), log to a dedicated `audit_logs` collection with the userId, action, and timestamp.

### 14.8 Staff Permission Checks

Always verify permissions server-side (in Functions) for staff operations:

```typescript
// In your Function or backend:
const role = await db.listDocuments(DB_ID, "staff_roles", [
  Query.equal("businessId", businessId),
  Query.equal("userId", requestingUserId),
  Query.equal("isActive", true),
]);

if (!role.documents[0]?.permissions.includes("delete_invoices")) {
  return res.json({ error: "Unauthorized" }, 403);
}
```

---

## 15. Troubleshooting

### Error: `AppwriteException: Missing scope (account)`

**Cause:** The user is not authenticated or the session has expired.  
**Fix:** Call `account.get()` — if it throws, redirect to login. Ensure `checkSession()` is called on app launch.

---

### Error: `AppwriteException: Document with the requested ID could not be found (404)`

**Cause:** Document doesn't exist, or the user has no `read` permission on it.  
**Fix:** Verify the document was created with `Permission.read(Role.user(userId))` matching the current user.

---

### Error: `AppwriteException: Invalid document structure: Unknown attribute "XXX"`

**Cause:** You're sending a field that doesn't exist in the collection schema.  
**Fix:** Check the collection's attributes and ensure your payload only contains defined attributes. Appwrite does **not** allow undefined fields by default.

---

### Error: OTP Not Received

**Causes & Fixes:**

1. SMS provider not configured → go to Messaging → Providers → add Twilio/MSG91
2. Phone number missing country code → ensure format `+91XXXXXXXXXX`
3. Rate limit hit → wait 1 hour or increase the limit in Auth Settings
4. DLT not approved (India) → register SMS template with TRAI via your provider

---

### Error: `Network request failed` on device

**Cause:** The device can't reach the Appwrite endpoint.  
**Fix:**

- For Cloud: Verify `EXPO_PUBLIC_APPWRITE_ENDPOINT` is `https://cloud.appwrite.io/v1`
- For self-hosted: Use your server's IP/domain, not `localhost` (physical devices can't reach `localhost`)
- Ensure your server has valid SSL (Appwrite SDK refuses plain HTTP on production)

---

### File Upload Fails (Image/PDF)

**Cause:** File size exceeds bucket limit, or wrong MIME type.  
**Fix:**

1. Check bucket settings → increase Max File Size if needed
2. Ensure `allowedFileExtensions` includes your file type
3. Compress images before uploading: use `expo-image-manipulator`

---

### Realtime Not Receiving Events

**Causes & Fixes:**

1. **Wrong channel string** — double-check `databases.{DB_ID}.collections.{COLLECTION_ID}.documents`
2. **Document permissions** — the subscribed user must have `read` permission on the document
3. **WebSocket blocked** — some corporate networks block WebSocket. Test on a mobile data connection.

---

### Self-Hosted: `502 Bad Gateway` on Install

**Cause:** Docker containers not all started.  
**Fix:**

```bash
cd /path/to/appwrite
docker compose ps   # check all services are "Up"
docker compose logs appwrite   # check for errors
docker compose restart appwrite
```

---

_End of APPWRITE.md — InvoiceFlow Backend Setup Guide_  
_For questions, open an issue at your project repository._
