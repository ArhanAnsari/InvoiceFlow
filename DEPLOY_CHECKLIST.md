# InvoiceFlow Deploy Checklist (Payments + Webhooks + Reminders)

Use this checklist for exact Appwrite console deployment and verification.

## A. Deploy Functions in Appwrite Console

1. Open Appwrite Console.
2. Go to `Functions`.
3. Create or update function: `payments-orchestrator`
   - Runtime: Node.js
   - Entry point: `src/main.js`
   - Build command: `npm install`
   - Deploy from folder: `appwrite/functions/payments-orchestrator`
4. Create or update function: `invoice-pdf-generator`
   - Runtime: Node.js
   - Entry point: `src/main.js`
   - Build command: `npm install`
   - Deploy from folder: `appwrite/functions/invoice-pdf-generator`
5. Create or update function: `reminder-automation`
   - Runtime: Node.js
   - Entry point: `src/main.js`
   - Build command: `npm install`
   - Deploy from folder: `appwrite/functions/reminder-automation`

## B. Configure Function Environment Variables

For `payments-orchestrator`:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_INVOICES`
- `COLLECTION_BUSINESSES`
- `COLLECTION_NOTIFICATIONS`
- `PUBLIC_PAYMENT_TOKEN_SECRET`
- `PUBLIC_PAYMENT_PAGE_BASE`
- `RAZORPAY_WEBHOOK_SECRET`
- `PHONEPE_SALT_KEY`
- `PAYTM_MERCHANT_KEY`

For `invoice-pdf-generator`:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_INVOICES`
- `COLLECTION_BUSINESSES`
- `COLLECTION_INVOICE_ITEMS`
- `BUCKET_INVOICE_PDFS`

For `reminder-automation`:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_BUSINESSES`
- `COLLECTION_INVOICES`
- `COLLECTION_NOTIFICATIONS`

## C. Update App `.env.local`

Set function IDs used by mobile app:

- `EXPO_PUBLIC_FUNC_PAYMENTS_ORCHESTRATOR`
- `EXPO_PUBLIC_FUNC_INVOICE_PDF_GENERATOR`
- `EXPO_PUBLIC_FUNC_REMINDER_AUTOMATION`
- `EXPO_PUBLIC_ADMIN_EMAIL` (optional but recommended for private admin tools)

## D. Collection Attribute Checklist

In `invoiceflow_db`, verify these attributes exist:

`invoices` collection:

- `paidAmount` (number)
- `balanceDue` (number)
- `paymentMethod` (string)
- `paymentDate` (datetime/string)
- `dueDate` (datetime/string)
- `pdfFileId` (string)

`businesses` collection:

- `upiId` (string, optional)

`notifications` collection:

- `userId` (string)
- `businessId` (string)
- `type` (string)
- `title` (string)
- `body` (string)
- `data` (string)
- `isRead` (boolean)

## E. Webhook Endpoint and Payload Examples

Your function route for verification:

- `POST /verify-webhook`

Request body shape accepted by app:

```json
{
  "provider": "razorpay",
  "payload": {
    "invoiceId": "<invoiceId>",
    "amount": 125000,
    "notes": { "invoiceId": "<invoiceId>" }
  },
  "signature": "<provider_signature>"
}
```

### Razorpay example

```json
{
  "provider": "razorpay",
  "payload": {
    "notes": { "invoiceId": "67f...abc" },
    "amount": 259900,
    "payment_id": "pay_123"
  },
  "signature": "razorpay-signature-here"
}
```

### PhonePe example

```json
{
  "provider": "phonepe",
  "payload": {
    "invoiceId": "67f...abc",
    "amount": 259900,
    "transactionId": "T20260324001"
  },
  "signature": "phonepe-signature-here"
}
```

### Paytm example

```json
{
  "provider": "paytm",
  "payload": {
    "invoiceId": "67f...abc",
    "txnAmount": 2599,
    "txnId": "PTM-9001"
  },
  "signature": "paytm-signature-here"
}
```

## F. Smoke Test Sequence

1. Open invoice detail and generate public payment link.
2. Open the link in public payment page.
3. Run Admin Tools webhook test with provider + invoice + amount.
4. Confirm invoice status updates (`partial` or `paid`).
5. Generate PDF and confirm `pdfFileId` is saved.
6. Run Smart Reminders and confirm reminder notifications are created.

## G. Rollback Plan

If deployment fails:

1. Roll back function deployment to previous successful version.
2. Reset app env IDs to previous function IDs.
3. Disable webhook endpoint temporarily in provider dashboard.
4. Continue payment recording manually from Payments screen.
