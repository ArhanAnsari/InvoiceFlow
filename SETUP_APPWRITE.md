# SETUP_APPWRITE.md

## Introduction

This guide details the step-by-step process to configure the Appwrite backend for **InvoiceFlow**. This setup covers Authentication, Database Collections, Storage, and Security Rules.

## Prerequisites

1.  **Appwrite Instance**: Cloud (cloud.appwrite.io) or Self-Hosted (Docker).
2.  **Appwrite CLI** (Optional but recommended): `npm install -g appwrite-cli`.
3.  **React Native Environment**: Ensure your Node.js and Expo environment is ready.

---

## Step 1: Create Appwrite Project

1.  Log in to [Appwrite Console](https://cloud.appwrite.io).
2.  Click **"Create Project"**.
3.  Name: `InvoiceFlow`.
4.  ID: `invoiceflow` (or leave auto-generated).
5.  Select region closest to your target audience (e.g., India, US).

---

## Step 2: Add Platform (React Native)

1.  In your project overview, scroll to **"Integrate with your platforms"**.
2.  Click **"Apple"** (iOS) and/or **"Android"**.
3.  **Name**: InvoiceFlow
4.  **Bundle ID / Package Name**: `com.yourname.invoiceflow` (Must match your `app.json`).
5.  Save the setup.

---

## Step 3: Enable Authentication

Navigate to **Auth** > **Settings** in the sidebar.

1.  **Email/Password**: Toggle **Enabled**.
2.  **Phone (SMS)**: Toggle **Enabled**. (Requires configuring a provider like Twilio/Msg91 in self-hosted, or built-in for Cloud).

---

## Step 4: Create Database & Collections

Navigate to **Databases**.

1.  Click **"Create Database"**.
2.  Name: `InvoiceFlowDB`.
3.  ID: `invoiceflow_db`.

Now, create the following Collections within `InvoiceFlowDB`.

### Collection 1: `businesses`

- **ID**: `businesses`
- **Attributes**:
  - `ownerId` (String, 255, Required)
  - `name` (String, 255, Required)
  - `gstin` (String, 50, Nullable)
  - `address` (String, 1000, Nullable)
  - `logoFileId` (String, 255, Nullable)
  - `planType` (Enum, Elements: `free`, `pro`, `enterprise`, Default: `free`)
- **Indexes**:
  - Key: `idx_owner`, Type: `Key`, Attribute: `ownerId`

### Collection 2: `customers`

- **ID**: `customers`
- **Attributes**:
  - `businessId` (String, 255, Required)
  - `name` (String, 255, Required)
  - `phone` (String, 20, Nullable)
  - `email` (String, 255, Nullable)
  - `address` (String, 1000, Nullable)
- **Indexes**:
  - Key: `idx_business`, Type: `Key`, Attribute: `businessId`
  - Key: `idx_search_name`, Type: `FullText`, Attribute: `name`

### Collection 3: `products`

- **ID**: `products`
- **Attributes**:
  - `businessId` (String, 255, Required)
  - `name` (String, 255, Required)
  - `price` (Float, Required)
  - `stock` (Integer, Default: 0)
  - `sku` (String, 100, Nullable)
- **Indexes**:
  - Key: `idx_business`, Type: `Key`, Attribute: `businessId`

### Collection 4: `invoices`

- **ID**: `invoices`
- **Attributes**:
  - `businessId` (String, 255, Required)
  - `customerId` (String, 255, Required)
  - `customerName` (String, 255, Required - denormalized for speed)
  - `invoiceNumber` (String, 50, Required)
  - `date` (Datetime, Required)
  - `totalAmount` (Float, Required)
  - `detailsJson` (String, 10000, Required) - _Stores line items as JSON string_
  - `status` (Enum: `paid`, `unpaid`, Default: `unpaid`)
- **Indexes**:
  - Key: `idx_business_date`, Type: `Key`, Attributes: `businessId`, `date`

---

## Step 5: Set Permissions (Security)

Proper permissions are crucial for multi-tenancy.

### Strategy: Teams as Businesses

1.  When a user creates a business, your app should create a **Team** in Appwrite.
2.  The User becomes the "Owner" of that team.

### Collection Permissions

Go to **Settings** for each Collection and set **Permissions**:

- **businesses**:
  - Role: `Any` -> **Data Leak! Do NOT do this.**
  - Role: `Users` -> **Create** (Anyone can create a business)
  - _Specific permissions are set on the Document Level by your code when creating the document._

**Recommended Default Document Security (implemented in code):**
When creating a document in `customers` or `invoices`:

- **Read**: `team:{businessId}`
- **Update**: `team:{businessId}`
- **Delete**: `team:{businessId}/owner`

---

## Step 6: Create Storage Bucket

Navigate to **Storage**.

1.  Click **"Create Bucket"**.
2.  Name: `BusinessLogos`.
3.  ID: `business_logos`.
4.  **Permissions**:
    - Role: `Any` -> **Read** (So logos can be displayed easily on public invoices).
    - Role: `Users` -> **Create**.
5.  **Settings**: Enable "Encryption" and "Antivirus" if available.
6.  **Allowed File Extensions**: `jpg`, `png`, `jpeg`.
7.  **Max File Size**: 5MB.

---

## Step 7: Create Functions (Optional for MVP)

Navigate to **Functions**.

1.  **Generate PDF Report** (Node.js):
    - Use `pdf-lib` or `puppeteer` (if self-hosted) to generate monthly reports.
2.  **Stock Management**:
    - Trigger: `databases.invoices.create`.
    - Logic: Iterate invoice items and decrement `stock` in `products` collection.

---

## Step 8: Environment Variables

Create a `.env` file in your React Native project root:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=invoiceflow
EXPO_PUBLIC_APPWRITE_DB_ID=invoiceflow_db
EXPO_PUBLIC_APPWRITE_BUCKET_LOGOS=business_logos
```

---

## Step 9: Connect React Native to Appwrite

Install the SDK:

```bash
npm install appwrite
```

Create `src/services/appwrite.ts`:

```typescript
import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform("com.yourname.invoiceflow");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export default client;
```

---

## Step 10: Testing

1.  Run the app: `npx expo start`.
2.  Attempt to register a user via Email.
3.  Check Appwrite Console > Auth > Users to verify creation.
4.  Attempt to create a business document.
5.  Check Appwrite Console > Databases > businesses to verify.

## Security Best Practices

1.  **Never expose API Keys** in your React Native code. Use the Client SDK which uses the Project ID (safe to expose).
2.  **Rate Limiting**: Enable Appwrite's built-in abuse protection settings.
3.  **Validation**: Use Appwrite's Attribute constraints (e.g., Min/Max values, RegEx) to validate data server-side.
