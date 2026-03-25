# 📱 InvoiceFlow - Enterprise Mobile Invoicing & Billing Platform

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb?logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?logo=typescript)
![Appwrite](https://img.shields.io/badge/Appwrite-22.4-fd366e?logo=appwrite)
![License](https://img.shields.io/badge/License-MIT-green)

**A production-ready, offline-first mobile invoicing platform built for SMEs with real-time synchronization and enterprise-grade features.**

[Features](#-features) • [Installation](#-installation) • [Architecture](#-architecture) • [Services](#-services) • [Development](#-development)

</div>

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Installation & Setup](#-installation--setup)
6. [Running the App](#-running-the-app)
7. [Architecture](#-architecture)
8. [Services & Backend](#-services--backend)
9. [State Management](#-state-management)
10. [Database Structure](#-database-structure)
11. [Authentication](#-authentication)
12. [Appwrite Functions](#-appwrite-functions)
13. [Development Guide](#-development-guide)
14. [Deployment](#-deployment)
15. [Bug Fixes & Known Issues](#-bug-fixes--known-issues)

---

## Overview

**InvoiceFlow** is an enterprise-grade mobile invoicing and billing platform designed for small-to-medium businesses (SMEs) to manage invoices, customers, products, payments, and analytics on iOS and Android.

### Key Highlights

- ✅ **Offline-First Architecture**: Full functionality without internet; automatic sync when online
- ✅ **Real-Time Sync**: Changes synchronized instantly via Appwrite Realtime (WebSocket)
- ✅ **Enterprise Features**: Multi-tenant support, GST/VAT tax calculation, digital signatures
- ✅ **Production-Ready**: TypeScript strict mode, Sentry error tracking, comprehensive documentation
- ✅ **Cross-Platform**: iOS, Android, and Web support via Expo
- ✅ **Scalable Backend**: Appwrite Cloud for database, storage, authentication, and serverless functions

---

## 🎯 Features

### 🔐 Authentication & Business Setup

- Email/Password and Phone OTP login
- Multi-device session management
- Persistent sessions (auto-login)
- Business profile setup with logo and digital signature
- GSTIN, PAN, and tax configuration
- Invoice prefix and numbering scheme
- Currency and tax type selection (GST/VAT/None)

### 💼 Customer Management

- Add, edit, delete customers
- Full-text search (name, phone, email)
- Customer GSTIN for B2B invoices
- State selection for tax logic (IGST vs CGST/SGST)
- Running balance tracking
- Customer tags and notes
- Customer statement generation

### 📦 Product & Inventory Management

- Add, edit, delete products and services
- SKU and barcode support
- Category grouping
- Unit of measure selection (pcs, kg, ltr, mtr, hrs, etc.)
- Stock tracking and low-stock warnings
- Tax classification per product

### 📄 Invoice Management

- Create invoices with line items
- Customize invoice templates
- Auto-numbering with prefix
- Multiple invoice states: Draft, Sent, Viewed, Overdue, Paid, Cancelled
- Rich invoice details (discounts, global tax, notes)
- Print and share invoices (PDF export)
- Invoice history and analytics

### 💳 Payment Tracking

- Mark invoices as paid (cash/cheque/online)
- Payment date and method tracking
- Overdue invoice alerts
- Payment reminders
- Payment analytics and reporting

### 📊 Analytics & Reporting

- Monthly revenue analysis
- Tax calculation and reports
- Customer payment performance
- Product sales analytics
- Dashboard with key metrics
- Activity timeline

### 🔔 Notifications

- Real-time invoice status updates
- Payment reminders
- Overdue invoice notifications
- System notifications for all activities

### 💾 Data Backup & Management

- Cloud backup creation
- Automatic data cleanup (old records)
- Subscription validation
- Stock deduction automation

### 🌐 Offline-First Sync

- Local SQLite database as source of truth
- Automatic queue-based sync system
- Conflict resolution for simultaneous changes
- Network status tracking with NetInfo
- Periodic sync on app startup and online restore

---

## 🛠 Tech Stack

| Category                    | Technology                                              |
| --------------------------- | ------------------------------------------------------- |
| **Framework**               | React Native 0.81.5 + Expo SDK 54                       |
| **Language**                | TypeScript 5.0+ (strict mode)                           |
| **Navigation**              | Expo Router (file-based) + React Navigation             |
| **State Management**        | Zustand (global) + TanStack React Query v5              |
| **Local Database**          | Expo SQLite + MMKV                                      |
| **Remote Backend**          | Appwrite (Database, Auth, Storage, Functions, Realtime) |
| **Authentication**          | Appwrite Auth (Email + Phone OTP)                       |
| **File Storage**            | Appwrite Storage Buckets                                |
| **Serverless**              | Appwrite Functions (Node.js 20)                         |
| **Real-Time Communication** | Appwrite Realtime (WebSocket)                           |
| **PDF Generation**          | expo-print + expo-sharing                               |
| **Charts & Analytics**      | Victory Native XL                                       |
| **Animations**              | React Native Reanimated 4                               |
| **Form Validation**         | React Hook Form + Zod                                   |
| **Error Tracking**          | Sentry (@sentry/react-native)                           |
| **UI Components**           | Expo Vector Icons, Expo Blur                            |
| **HTTP Client**             | Appwrite SDK                                            |
| **Date/Time**               | date-fns                                                |
| **Network Detection**       | @react-native-community/netinfo                         |
| **Gesture Handling**        | react-native-gesture-handler                            |
| **Safe Area**               | react-native-safe-area-context                          |

---

## 📁 Project Structure

```
InvoiceFlow/
├── app/
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   ├── business-setup.tsx
│   │   └── _layout.tsx
│   ├── (main)/              # Main app screens (tab-based)
│   │   ├── index.tsx        # Dashboard
│   │   ├── activity.tsx     # Activity timeline
│   │   ├── admin.tsx        # Admin dashboard
│   │   ├── ai-assistant.tsx # AI assistant screen
│   │   ├── customers.tsx    # Customer management
│   │   ├── payments.tsx     # Payment tracking
│   │   ├── products.tsx     # Product management
│   │   ├── notifications.tsx
│   │   ├── more.tsx         # Settings & more
│   │   ├── tutorial.tsx     # Tutorial screen
│   │   ├── invoices/        # Invoice screens
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id].tsx
│   │   └── _layout.tsx
│   ├── (public)/            # Public routes
│   │   └── pay.tsx         # Public payment page
│   ├── modal.tsx            # Modal overlay
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ThemedButton.tsx
│   │   ├── ThemedInput.tsx
│   │   └── ui/
│   ├── hooks/               # Custom React hooks
│   │   └── useRealtimeInvoices.ts
│   ├── services/            # API & business logic services
│   │   ├── appwrite.ts      # Appwrite SDK initialization
│   │   ├── authService.ts   # Authentication
│   │   ├── database.ts      # Local SQLite operations
│   │   ├── sync.ts          # Sync orchestration
│   │   ├── invoiceItemsService.ts
│   │   ├── aiService.ts     # AI assistant API
│   │   ├── notificationService.ts
│   │   ├── reportsService.ts
│   │   ├── backupService.ts
│   │   ├── functionsService.ts
│   │   ├── realtimeService.ts
│   │   ├── activityService.ts
│   │   ├── staffService.ts
│   │   ├── subscriptionService.ts
│   │   └── storageService.ts
│   ├── store/               # Zustand state stores
│   │   ├── authStore.ts     # Auth state
│   │   ├── businessStore.ts # Business profile state
│   │   ├── customerStore.ts # Customers state
│   │   ├── invoiceStore.ts  # Invoices state
│   │   ├── productStore.ts  # Products state
│   │   ├── notificationStore.ts
│   │   ├── uiStore.ts
│   │   └── onboardingStore.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── patchWebSocket.ts
├── appwrite/                # Appwrite functions & config
│   ├── functions/
│   │   ├── ai-assistant/
│   │   ├── analytics-calculator/
│   │   ├── backup-creator/
│   │   ├── cleanup-old-data/
│   │   ├── invoice-pdf-generator/
│   │   ├── monthly-report-generator/
│   │   ├── payments-orchestrator/
│   │   ├── reminder-automation/
│   │   ├── stock-deduction/
│   │   └── subscription-validator/
│   ├── appwrite.json        # Infrastructure as Code
│   ├── appwrite.phase1.json # Phase 1 config
│   └── appwrite.phase2.json # Phase 2 config
├── assets/                  # Static assets (images, fonts)
├── constants/               # App constants (theme, etc.)
├── components/              # Global components
├── hooks/                   # Global hooks
├── eas.json                 # Expo Application Services config
└── package.json             # Dependencies
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Appwrite account (Cloud at https://cloud.appwrite.io or self-hosted)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio + Android SDK

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd InvoiceFlow

# Install dependencies
npm install
```

If you encounter PowerShell execution policy issues on Windows:

```bash
npm.cmd install
```

### Step 2: Configure Appwrite

1. **Create Appwrite Project**
   - Go to https://cloud.appwrite.io
   - Create a new project named "InvoiceFlow"
   - Note the Project ID

2. **Setup Appwrite via Infrastructure as Code** (Recommended)

   ```bash
   # Install Appwrite CLI
   npm install -g appwrite-cli

   # Login to Appwrite
   appwrite login

   # Deploy infrastructure from appwrite.json
   appwrite deploy collection
   appwrite deploy bucket
   appwrite deploy function
   ```

3. **Or Manual Setup** - Follow [SETUP_APPWRITE.md](SETUP_APPWRITE.md) for step-by-step console setup

### Step 3: Configure Environment

Create `.env.local` (or update existing) with your Appwrite credentials:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=invoiceflow_db
EXPO_PUBLIC_APPWRITE_API_KEY=your_api_key
```

Update package identifiers in `app.json`:

```json
{
  "expo": {
    "name": "InvoiceFlow",
    "slug": "invoiceflow",
    "scheme": "invoiceflow",
    "android": {
      "package": "com.yourcompany.invoiceflow"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.invoiceflow"
    }
  }
}
```

### Step 4: Initialize Local Database

On first launch, the app automatically initializes the SQLite database via `src/services/database.ts`. Tables created:

- `businesses`
- `customers`
- `products`
- `invoices`
- `invoice_items`
- `payments`
- `subscriptions`
- `notifications`
- `sync_queue`

---

## ▶️ Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Or with yarn
yarn start
```

Options from Expo CLI:

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web
- Press `Scan with Expo Go` to use Expo Go app on device

### Run on Specific Platform

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

### Build for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for Web
eas build --platform web
```

---

## 🏗️ Architecture

### Offline-First Design

InvoiceFlow uses a **Sync Queue Architecture**:

1. **User Action** → Create/Update/Delete in Local SQLite
2. **Instant UI Update** → State updates immediately from local DB
3. **Queue Item Added** → Changes queued for sync
4. **Auto Sync** → On app start, network restore, or periodic interval
5. **Conflict Resolution** → Server wins on conflicts (can be customized)
6. **Pull Changes** → Sync latest remote data back to local DB

### Data Flow

```
User Action
    ↓
Local SQLite (source of truth)
    ↓
Zustand Store (UI state)
    ↓
Screen Rendering
    ↓
Auto-Sync Queue
    ↓
Appwrite Cloud (backup + multi-device sync)
    ↓
Realtime Subscription
    ↓
Pull Changes Back to Local DB
```

### Real-Time Sync

- **Realtime Service** (`src/services/realtimeService.ts`) - Subscribes to Appwrite realtime events
- **Automatic Merge** - Incoming remote changes merged into local store
- **Conflict Handling** - Server state takes precedence
- **WebSocket Connection** - Maintained throughout app lifecycle

---

## 🔌 Services & Backend

All backend services are in `src/services/`:

### Core Services

| Service            | Purpose                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **appwrite.ts**    | Appwrite SDK initialization and configuration                              |
| **authService.ts** | User authentication (signup, login, phone OTP, logout)                     |
| **database.ts**    | SQLite operations (init, CRUD for all tables, migrations)                  |
| **sync.ts**        | Sync queue orchestration (push changes, pull changes, conflict resolution) |

### Domain Services

| Service                    | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| **realtimeService.ts**     | Appwrite Realtime WebSocket subscriptions              |
| **invoiceItemsService.ts** | Invoice line items operations                          |
| **aiService.ts**           | AI assistant integration for smart invoice suggestions |
| **notificationService.ts** | Create, fetch, mark as read notifications              |
| **reportsService.ts**      | Generate analytics and monthly reports                 |
| **backupService.ts**       | Create and restore data backups                        |
| **functionsService.ts**    | Trigger and manage Appwrite serverless functions       |
| **activityService.ts**     | Track and retrieve user activity timeline              |
| **staffService.ts**        | Staff/team member management (enterprise feature)      |
| **subscriptionService.ts** | Subscription validation and plan management            |
| **storageService.ts**      | File upload/download (logos, signatures, PDFs)         |

### Service Usage Example

```typescript
import { authService } from "@/services/authService";
import { invoiceStore } from "@/store/invoiceStore";

// Authentication
const session = await authService.login(email, password);

// Fetch from local + remote
const invoices = await invoiceStore.fetchInvoices();

// Sync queue handles persistence automatically
```

---

## 📦 State Management

InvoiceFlow uses **Zustand** for global state with TypeScript:

### Store Structure

**`authStore.ts`** - Authentication state

```typescript
- user: User | null
- session: Session | null
- isLoading: boolean
- login(email, password)
- logout()
- setUser()
```

**`businessStore.ts`** - Business profile state

```typescript
- business: Business
- currency: string
- taxType: 'GST' | 'VAT' | 'NONE'
- updateBusiness()
- setCurrency()
```

**`customerStore.ts`** - Customers state

```typescript
- customers: Customer[]
- fetchCustomers()
- addCustomer()
- updateCustomer()
- deleteCustomer()
- searchCustomers(query)
```

**`invoiceStore.ts`** - Invoices state with sync merging

```typescript
- invoices: Invoice[]
- fetchInvoices()
- createInvoice()
- updateInvoice()
- deleteInvoice()
- Merges local + remote to prevent data loss
```

**`productStore.ts`** - Products state

```typescript
- products: Product[]
- fetchProducts()
- addProduct()
- updateProduct()
- deleteProduct()
```

**`notificationStore.ts`** - Notifications state

```typescript
- notifications: Notification[]
- fetchNotifications()
- markAsRead()
```

**`uiStore.ts`** - UI state

```typescript
- theme: 'light' | 'dark'
- sidebarOpen: boolean
```

**`onboardingStore.ts`** - Onboarding flow

```typescript
- completedSteps: string[]
- markStepComplete()
```

### Accessing Store in Components

```typescript
import { useInvoiceStore } from '@/store/invoiceStore';

export function InvoicesList() {
  const { invoices, fetchInvoices } = useInvoiceStore();

  useEffect(() => {
    fetchInvoices();
  }, []);

  return invoices.map(invoice => <InvoiceCard key={invoice.$id} invoice={invoice} />);
}
```

---

## 🗄️ Database Structure

### Collections (Appwrite)

#### businesses

- `$id`: string (userId)
- `ownerId`: string
- `name`: string
- `gstin`: string (optional)
- `pan`: string (optional)
- `address`: string
- `city`: string
- `state`: string
- `pincode`: string
- `phone`: string
- `email`: string
- `logoFileId`: string (optional)
- `signatureFileId`: string (optional)
- `currencySymbol`: string
- `taxType`: 'GST' | 'VAT' | 'NONE'
- `invoicePrefix`: string
- `invoiceNumberStart`: integer
- `createdAt`: datetime
- `updatedAt`: datetime

#### customers

- `$id`: string
- `businessId`: string
- `name`: string
- `phone`: string (optional)
- `email`: string (optional)
- `address`: string
- `city`: string
- `state`: string
- `gstin`: string (B2B, optional)
- `tags`: string[] (VIP, Wholesale, etc.)
- `notes`: string
- `runningBalance`: double
- `createdAt`: datetime

#### products

- `$id`: string
- `businessId`: string
- `name`: string
- `sku`: string
- `barcode`: string (optional)
- `description`: string
- `category`: string
- `unitOfMeasure`: string (pcs, kg, ltr, etc.)
- `price`: double
- `taxRate`: double (0-100)
- `stock`: integer
- `lowStockAlert`: integer
- `createdAt`: datetime

#### invoices

- `$id`: string
- `businessId`: string
- `invoiceNumber`: string (unique)
- `customerId`: string
- `status`: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
- `issueDate`: datetime
- `dueDate`: datetime
- `subtotal`: double
- `taxAmount`: double
- `discountAmount`: double
- `totalAmount`: double
- `notes`: string
- `isSynced`: integer (0 = pending, 1 = synced)
- `createdAt`: datetime
- `updatedAt`: datetime

#### invoice_items

- `$id`: string
- `invoiceId`: string
- `productId`: string (optional)
- `description`: string
- `quantity`: double
- `rate`: double
- `taxRate`: double
- `amount`: double
- `createdAt`: datetime

#### payments

- `$id`: string
- `invoiceId`: string
- `businessId`: string
- `amount`: double
- `paymentMethod`: 'cash' | 'cheque' | 'online'
- `paymentDate`: datetime
- `notes`: string
- `createdAt`: datetime

#### subscriptions

- `$id`: string
- `businessId`: string
- `planType`: 'free' | 'pro' | 'enterprise'
- `status`: 'active' | 'cancelled' | 'expired'
- `renewalDate`: datetime
- `createdAt`: datetime

#### notifications

- `$id`: string
- `businessId`: string
- `userId`: string
- `type`: 'invoice' | 'payment' | 'reminder' | 'system'
- `title`: string
- `message`: string
- `isRead`: boolean
- `createdAt`: datetime

#### monthly_reports

- `$id`: string
- `businessId`: string
- `month`: string (YYYY-MM format)
- `totalInvoices`: integer
- `totalRevenue`: double
- `totalTax`: double
- `paidCount`: integer
- `unpaidCount`: integer
- `createdAt`: datetime

### Tables (Local SQLite)

Same structure as Collections above, plus:

- **sync_queue** - Pending sync operations
  - `id`: integer (primary)
  - `collection`: string
  - `operation`: string ('CREATE' | 'UPDATE' | 'DELETE')
  - `documentId`: string
  - `data`: JSON
  - `timestamp`: datetime
  - `retries`: integer

---

## 🔐 Authentication

### Login Flow

1. **Email/Password**
   - Input email + password on login screen
   - Call `authService.login(email, password)`
   - Appwrite validates credentials
   - Session token generated and stored
   - User data fetched and stored in `authStore`

2. **Phone OTP**
   - Input phone number with country code
   - Call `authService.sendPhoneOTP(phone)`
   - Wait for OTP SMS
   - Verify with `authService.verifyOTP(phone, otp)`
   - Create session on successful verification

### Signup Flow

1. Input email, password, phone, country code
2. Call `authService.signup(email, password, phone)`
3. Email verification link sent
4. User clicks verification link or app handles deeplink
5. Account activated
6. Business setup screen shown (onboarding)

### Session Management

```typescript
// Current user & session
const { user, session } = useAuthStore();

// Auto-logout on session expiry
const checkSessionValidity = async () => {
  const isValid = await authService.isSessionValid();
  if (!isValid) logout();
};

// Periodic check every 5 minutes
setInterval(checkSessionValidity, 5 * 60 * 1000);
```

### Logout

- Current device: `authService.logout()`
- All devices: `authService.logoutAllDevices()`

---

## 🔧 Appwrite Functions

Serverless functions run on Node.js 20 runtime for automated tasks:

### 1. **monthly-report-generator**

- **Trigger**: Cron `0 1 1 * *` (1 AM on 1st of month)
- **Purpose**: Generate monthly revenue reports for all businesses
- **Output**: Creates `monthly_reports` collection documents

### 2. **analytics-calculator**

- **Trigger**: Cron `0 2 * * *` (2 AM daily)
- **Purpose**: Calculate analytics metrics (sales, tax, customer metrics)
- **Output**: Updates business analytics data

### 3. **stock-deduction**

- **Trigger**: Event `databases.invoiceflow_db.collections.invoices.documents.*.create`
- **Purpose**: Automatically reduce product stock when invoice is created
- **Logic**: Reads invoice items, decrements product stock in database

### 4. **subscription-validator**

- **Trigger**: HTTP endpoint (manual or scheduled)
- **Purpose**: Validate subscription status, handle expiries
- **Logic**: Check subscription dates, handle plan downgrades

### 5. **backup-creator**

- **Trigger**: HTTP endpoint (user-initiated)
- **Purpose**: Create compressed backup of all business data
- **Output**: ZIP file in `backups` storage bucket

### 6. **cleanup-old-data**

- **Trigger**: Cron `0 3 * * 0` (3 AM every Sunday)
- **Purpose**: Archive/delete old data based on retention policy
- **Logic**: Delete invoices > 2 years old, cleanup old notifications

### 7. **invoice-pdf-generator** (Phase 2)

- **Trigger**: HTTP endpoint
- **Purpose**: Generate PDF from invoice data
- **Output**: PDF file in storage

### 8. **reminder-automation** (Phase 2)

- **Trigger**: Cron `0 9 * * *` (9 AM daily)
- **Purpose**: Send payment reminders for overdue invoices
- **Output**: Creates notification records

### 9. **payments-orchestrator** (Phase 2)

- **Trigger**: Webhook from payment gateway
- **Purpose**: Handle Razorpay/Stripe webhook callbacks
- **Logic**: Update invoice status to paid, trigger notifications

### 10. **ai-assistant** (Phase 2)

- **Trigger**: HTTP endpoint (real-time)
- **Purpose**: AI-powered suggestions for invoices
- **Integration**: OpenAI/Claude API calls

---

## 💻 Development Guide

### Creating a New Screen

1. Create file in `app/(main)/newscreen.tsx` or `app/(auth)/newscreen.tsx`
2. Import hooks and stores as needed
3. Use Zustand stores for state
4. Handle offline functionality

```typescript
import { useInvoiceStore } from '@/store/invoiceStore';
import { useNetworkConnection } from '@react-native-community/netinfo';

export default function NewScreen() {
  const { invoices, fetchInvoices } = useInvoiceStore();
  const isOnline = useNetworkConnection();

  useEffect(() => {
    if (isOnline) {
      fetchInvoices(); // Will trigger sync
    }
  }, [isOnline]);

  return <View>{/* UI */}</View>;
}
```

### Adding a New Service

1. Create `src/services/myService.ts`
2. Define functions for API calls and local operations
3. Export functions and types
4. Use in stores or components

```typescript
import { client } from "./appwrite";
import { databases } from "./appwrite";

export const myService = {
  async fetchData() {
    return databases.listDocuments("invoiceflow_db", "my_collection");
  },
};
```

### Adding State to Store

1. Update store file (e.g., `src/store/myStore.ts`)
2. Add state fields and actions
3. Export and use in components

```typescript
export const useMyStore = create((set) => ({
  myData: [],
  fetchMyData: async () => {
    const response = await myService.fetchData();
    set({ myData: response.documents });
  },
}));
```

### Offline Sync Best Practices

1. **Always Save Locally First**

   ```typescript
   await database.insertInvoice(newInvoice); // Local
   invoiceStore.addInvoice(newInvoice); // State
   // Sync happens automatically in background
   ```

2. **Don't Await Sync**
   - Sync happens asynchronously
   - User gets immediate feedback from local state

3. **Handle Network State**

   ```typescript
   import NetInfo from "@react-native-community/netinfo";

   NetInfo.addEventListener((state) => {
     if (state.isConnected) {
       sync.startSync(); // Resume sync
     }
   });
   ```

### Testing Offline Functionality

1. **Simulate Offline**: Toggle airplane mode or disable WiFi
2. **Make Changes**: Create invoice offline
3. **Go Online**: Re-enable network
4. **Verify Sync**: Check Appwrite console for synced data

---

## 🚀 Deployment

### Build & Release

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios --auto-submit

# Build for Android
eas build --platform android

# Create update for OTA updates
eas update
```

### Web Deployment

```bash
# Build web version
npm run web

# Deploy to Vercel, Netlify, etc.
vercel deploy
```

### Appwrite Setup for Production

1. Use Appwrite Cloud or self-hosted with proper SSL
2. Set API key restrictions to client domains
3. Enable rate limiting
4. Configure CORS for web platform
5. Enable backup and recovery
6. Set up monitoring and alerts in Appwrite Console

---

## 🐛 Bug Fixes & Known Issues

### Fixed Issues

✅ **Invoices Disappearing After Creation**

- **Fix**: Modified `invoiceStore.ts` to merge local and remote data, preserving unsynced invoices

✅ **DB Collections Not Saving**

- **Fix**: Updated `sync.ts` to mark items as synced after successful push; extended `pullChanges()` to sync invoices and items

✅ **Currency Symbol Displaying as "?"**

- **Fix**: Updated currency symbol mapping in `businessStore.ts` with proper Unicode characters (₹, $, €, £)

✅ **Users Logged Out Automatically**

- **Fix**: Added periodic session check every 5 minutes; fixed dependency array in logout effect

✅ **Display Issues with "?" Characters**

- **Fix**: Replaced placeholder text with proper values (⚠️ for low stock, "..." for loading)

### Known Limitations

- Phone OTP requires Appwrite Cloud or Twilio/SMS provider setup
- PDF generation requires expo-print and expo-sharing libraries
- Realtime sync requires WebSocket connection (may have issues behind some firewalls)

---

## 📚 Additional Resources

- [TECHNICAL_BLUEPRINT.md](TECHNICAL_BLUEPRINT.md) - Detailed architecture and design patterns
- [SETUP_APPWRITE.md](SETUP_APPWRITE.md) - Step-by-step Appwrite configuration
- [Function_Appwrite.md](Function_Appwrite.md) - Serverless functions setup
- [PAYMENT_SETUP_GUIDE.md](PAYMENT_SETUP_GUIDE.md) - Payment gateway integration
- [BUG_FIXES_SUMMARY.md](BUG_FIXES_SUMMARY.md) - Issues and solutions
- [FUTURE_FEATURES.md](FUTURE_FEATURES.md) - Planned enhancements

---

## 🤝 Contributing

To contribute to InvoiceFlow:

1. Create a feature branch
2. Make changes following the architecture patterns
3. Test offline-first functionality
4. Update documentation
5. Submit pull request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 📞 Support

For issues, questions, or feature requests:

- Check existing documentation files
- Review [BUG_FIXES_SUMMARY.md](BUG_FIXES_SUMMARY.md)
- Consult [TECHNICAL_BLUEPRINT.md](TECHNICAL_BLUEPRINT.md) for architecture questions

---

**Last Updated**: March 2026 | **Version**: 1.0.4
