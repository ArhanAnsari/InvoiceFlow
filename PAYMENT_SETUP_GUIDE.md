# InvoiceFlow Payment Setup Guide

This guide helps you set up UPI payments, payment-provider secrets, and webhook verification so payments auto-settle invoices.

## 1. Prerequisites

- Appwrite project with InvoiceFlow database/collections already created.
- Deployed Appwrite functions:
  - payments-orchestrator
  - invoice-pdf-generator
  - reminder-automation
- At least one active business record in `businesses`.

## 2. Configure UPI for QR + Payment Intents

UPI does not use secret keys in the app flow. You need a valid UPI ID (VPA) such as `yourname@okhdfcbank`.

1. In Appwrite Console, open `Databases -> invoiceflow_db -> businesses -> Attributes`.
2. Ensure a text attribute exists for UPI ID. Recommended key: `upiId`.
3. Open your business document and set `upiId` to your real VPA.
4. Save document.

Result:

- Invoice Detail page can generate UPI URI.
- QR code shown on invoice can be scanned for payment.

## 3. App Environment Variables (Mobile App)

In `.env.local`, keep these function IDs updated to deployed function IDs:

- `EXPO_PUBLIC_FUNC_PAYMENTS_ORCHESTRATOR`
- `EXPO_PUBLIC_FUNC_INVOICE_PDF_GENERATOR`
- `EXPO_PUBLIC_FUNC_REMINDER_AUTOMATION`

Optional but recommended for admin-only tools:

- `EXPO_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com`

## 4. Function Environment Variables (Server-side)

Set these in Appwrite Console for `payments-orchestrator`:

Core:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_INVOICES`
- `COLLECTION_BUSINESSES`
- `COLLECTION_NOTIFICATIONS`

Public payment link security:

- `PUBLIC_PAYMENT_TOKEN_SECRET` (random strong secret)
- `PUBLIC_PAYMENT_PAGE_BASE` (for example `https://your-domain.com/pay`)

Provider webhook verification:

- `RAZORPAY_WEBHOOK_SECRET`
- `PHONEPE_SALT_KEY`
- `PAYTM_MERCHANT_KEY`

Set these in `invoice-pdf-generator`:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_INVOICES`
- `COLLECTION_BUSINESSES`
- `COLLECTION_INVOICE_ITEMS`
- `BUCKET_INVOICE_PDFS`

Set these in `reminder-automation`:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DB_ID`
- `COLLECTION_BUSINESSES`
- `COLLECTION_INVOICES`
- `COLLECTION_NOTIFICATIONS`

## 5. Where to Get Secrets

### Razorpay

1. Open Razorpay Dashboard.
2. Go to `Settings -> Webhooks`.
3. Create webhook URL pointing to your Appwrite function endpoint for `/verify-webhook`.
4. Copy webhook secret and set as `RAZORPAY_WEBHOOK_SECRET`.

### PhonePe

1. Open PhonePe merchant panel.
2. Get your API signing salt key.
3. Set `PHONEPE_SALT_KEY` in function env.

### Paytm

1. Open Paytm merchant dashboard.
2. Get merchant key used for signature verification.
3. Set `PAYTM_MERCHANT_KEY` in function env.

## 6. Validate End-to-End

1. Generate payment link from invoice detail screen.
2. Open public payment page using tokenized link.
3. Complete payment via UPI.
4. Trigger webhook from provider (or test via Admin Tools screen).
5. Verify invoice gets updated:
   - `paidAmount`
   - `balanceDue`
   - `status` (`partial` or `paid`)
   - `paymentMethod`
   - `paymentDate`
6. Confirm payment notification appears in Notification Center.

## 7. Security Notes

- Never commit real secrets to Git.
- Rotate webhook secrets if exposed.
- Keep `PUBLIC_PAYMENT_TOKEN_SECRET` strong and private.
- Do not enable Admin Tools for non-admin accounts.
