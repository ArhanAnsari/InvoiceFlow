# 🏗️ InvoiceFlow v2 — Technical Blueprint & Architecture

> **Version:** 2.0 | **Platform:** iOS + Android | **Last Updated:** February 2026  
> **Stack:** React Native · Expo SDK 54 · TypeScript · Appwrite · Zustand · Expo SQLite

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Complete Feature Set](#2-complete-feature-set)
3. [UI Redesign Plan](#3-ui-redesign-plan)
4. [Screen-by-Screen Design & Navigation](#4-screen-by-screen-design--navigation)
5. [Navigation Architecture](#5-navigation-architecture)
6. [Application Architecture](#6-application-architecture)
7. [Database Schema](#7-database-schema)
8. [Appwrite Functions Plan](#8-appwrite-functions-plan)
9. [Frontend Folder Structure](#9-frontend-folder-structure)
10. [State Management Design](#10-state-management-design)
11. [Offline-First Architecture](#11-offline-first-architecture)
12. [Tech Stack & Dependencies](#12-tech-stack--dependencies)

---

## 1. System Overview

**InvoiceFlow v2** is a production-ready, enterprise-grade mobile billing and invoicing platform for small-to-medium businesses (SMEs). Built on an **Offline-First** architecture — the app is fully functional without internet access, with all changes queued and synced to **Appwrite Cloud** when connectivity is restored.

### Design Philosophy

- **Mobile-first:** Designed exclusively for iOS & Android. No desktop compromise.
- **Offline-first:** SQLite is the single source of truth; Appwrite is the sync target.
- **Multi-tenant:** One Appwrite project serves all users via document-level permissions. Each user's data is fully isolated.
- **Performance:** All list screens use virtualized rendering. Local SQLite queries are synchronous for instant response.
- **Accessibility:** WCAG 2.1 AA compliant — screen reader support, color contrast, tap target sizing.

### Tech Stack Summary

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Framework  | React Native + Expo SDK 54                       |
| Language   | TypeScript (strict mode)                         |
| Navigation | Expo Router (file-based) + React Navigation      |
| State      | Zustand (global) + TanStack Query (server cache) |
| Local DB   | Expo SQLite (structured) + MMKV (settings/KV)    |
| Remote DB  | Appwrite Database                                |
| Auth       | Appwrite Auth (Email + Phone OTP)                |
| Storage    | Appwrite Storage                                 |
| Functions  | Appwrite Functions (Node.js 20)                  |
| Realtime   | Appwrite Realtime (WebSocket)                    |
| PDF        | expo-print + expo-sharing                        |
| Charts     | Victory Native XL                                |
| Animations | React Native Reanimated 4                        |
| Forms      | React Hook Form + Zod                            |

---

## 2. Complete Feature Set

### 🟢 Basic Features (MVP — V1)

#### Authentication

- [x] Email/Password registration and login
- [x] Phone OTP login with country code picker
- [x] Persistent sessions (auto-login on relaunch)
- [x] Logout (current device) and logout all devices
- [x] Password reset via email link
- [x] Email verification on signup

#### Business Profile

- [x] Business name, tagline
- [x] Logo upload (camera or gallery)
- [x] Digital signature upload
- [x] GSTIN number with format validation
- [x] PAN number
- [x] Full address (street, city, state, pincode)
- [x] Business phone and email
- [x] Currency and currency symbol selection
- [x] Invoice prefix and auto-numbering
- [x] Tax type selection (GST / VAT / None)

#### Customer Management

- [x] Add, edit, delete customers
- [x] Full-text search (name, phone, email)
- [x] Customer GSTIN for B2B invoices
- [x] State selection (for IGST vs CGST/SGST logic)
- [x] Running balance tracking per customer
- [x] Customer tags (VIP, Wholesale, Retail, etc.)
- [x] Notes per customer
- [x] Customer statement (all invoices list)

#### Product / Inventory

- [x] Add, edit, delete products and services
- [x] SKU and barcode field
- [x] Category grouping
- [x] Unit of measure (pcs, kg, ltr, mtr, hrs, etc.)
- [x] Selling price, cost price, MRP
- [x] HSN/SAC code
- [x] GST tax rate per product
- [x] Stock quantity tracking
- [x] Low-stock threshold alert
- [x] Product image upload
- [x] Mark as service (skips stock tracking)

#### Invoicing

- [x] Create invoice with customer lookup
- [x] Add multiple line items with product search
- [x] Quantity and price override per line
- [x] Flat and percentage discounts
- [x] Auto GST calculation (CGST + SGST for intra-state, IGST for inter-state)
- [x] Invoice status: Unpaid / Partial / Paid / Cancelled
- [x] Due date with reminder
- [x] Payment method tracking (Cash / UPI / Card / Bank Transfer)
- [x] Notes and terms & conditions
- [x] Custom invoice number override
- [x] Invoice duplication (clone existing)

#### PDF Invoice Generation

- [x] Full-bleed professional PDF layout
- [x] Business logo and signature
- [x] QR code for UPI payment
- [x] GST breakup table (CGST, SGST, IGST)
- [x] Amount in words (Indian numbering system)
- [x] Download to device
- [x] Share via native share sheet (WhatsApp, email, etc.)
- [x] Print via AirPrint / Google Cloud Print

#### Offline Mode

- [x] All CRUD operations work without internet
- [x] Sync queue with automatic retry
- [x] Sync indicator in UI (syncing / synced / offline)
- [x] Conflict resolution (last-write-wins with timestamp)

#### Basic Reports

- [x] Daily, weekly, monthly revenue summary
- [x] Paid vs. unpaid invoice count and amount
- [x] Tax collected summary (GST breakup)
- [x] Export report as PDF or CSV

#### Settings

- [x] Dark mode / Light mode / System default
- [x] Language selection (English, Hindi, Marathi)
- [x] Invoice template customization (colors, font)
- [x] Terms & conditions default text
- [x] Data backup and restore

---

### 🟡 Advanced Features (V2)

#### Cloud Sync & Multi-Device

- [ ] Real-time sync across all logged-in devices
- [ ] Conflict detection and resolution UI
- [ ] Sync history log
- [ ] Last synced timestamp display

#### Multi-Business

- [ ] Create and manage multiple businesses under one account
- [ ] Business switcher with quick-access bottom sheet
- [ ] Each business has independent data, settings, and plans
- [ ] Business archive / deactivate

#### Inventory Management

- [ ] Automatic stock deduction on invoice creation (via Appwrite Function)
- [ ] Low-stock push notifications
- [ ] Stock adjustment journal (manual add/subtract with reason)
- [ ] Purchase order tracking
- [ ] Inventory valuation report

#### Role-Based Access Control (RBAC)

- [ ] Owner role: full access
- [ ] Manager role: all except subscription management
- [ ] Staff role: create invoices, add customers/products
- [ ] Viewer role: read-only
- [ ] Per-permission overrides
- [ ] Staff invite via email link
- [ ] Activity log per staff member

#### Subscription / Monetization

- [ ] Free plan: 50 invoices/month, 1 business, basic PDF
- [ ] Pro plan: unlimited invoices, 3 businesses, custom templates, priority support
- [ ] Enterprise plan: unlimited everything, multi-staff, API access
- [ ] In-App Purchase (iOS StoreKit 2 + Android Billing Library 6)
- [ ] RevenueCat integration for cross-platform purchase management
- [ ] Subscription status validated via Appwrite Function
- [ ] 14-day free trial for Pro

#### Analytics Dashboard

- [ ] Revenue trend chart (line/bar, 7/30/90 days)
- [ ] Top 5 customers by revenue
- [ ] Top 5 products by quantity sold
- [ ] Unpaid aging report (30/60/90+ days overdue)
- [ ] Gross profit margin per product
- [ ] Tax liability summary

#### Security

- [ ] JWT-based Appwrite sessions with refresh tokens
- [ ] Document-level multi-tenant isolation
- [ ] Encrypted local storage via MMKV (AES-256)
- [ ] Biometric lock (Face ID / Fingerprint) for app access
- [ ] Rate limiting on all auth endpoints (configured in Appwrite)
- [ ] Audit log for sensitive operations

#### Backup & Restore

- [ ] Manual cloud backup (triggers Appwrite Function)
- [ ] Scheduled auto-backup (weekly, configurable)
- [ ] Restore from backup with conflict preview
- [ ] Export full data as ZIP (JSON files)
- [ ] Backup retention: last 5 backups

#### Notifications

- [ ] Push notifications via Expo Notifications
- [ ] In-app notification center
- [ ] Low stock alerts
- [ ] Invoice due date reminders (D-3, D-1, D-day)
- [ ] Payment received confirmation
- [ ] Monthly summary notification

---

### 🔵 Future / Roadmap Features (V3 — Design Placeholder Only)

- **AI Sales Prediction** — Forecast next month revenue based on historical trends (on-device Core ML / TensorFlow Lite)
- **OCR Bill Scanner** — Camera-based scanning of purchase bills to auto-create products/expenses
- **Voice Invoice Creation** — "Hey, create an invoice for Ravi for 5 units of Widget A"
- **UPI Auto-Reconciliation** — Parse UPI payment SMS to auto-mark invoices as paid
- **WhatsApp Business API** — Send invoices directly via WhatsApp Business
- **Fraud Detection** — Flag unusually large invoices or frequency bursts
- **Web Admin Panel** — Next.js dashboard for owners who prefer desktop
- **Tally ERP Export** — Export data in Tally-compatible format
- **E-Invoice (IRN)** — Integrate with GST E-Invoice portal for IRN generation
- **E-Way Bill** — Generate E-Way bills for goods transport

---

## 3. UI Redesign Plan

### 3.1 Design System

#### Color Palette

```
Light Mode:
  Background:       #F5F7FA   (near-white, warm gray)
  Surface:          #FFFFFF
  Surface Raised:   #FFFFFF   (with shadow)
  Primary:          #6C63FF   (vibrant indigo-purple)
  Primary Light:    #EEF2FF
  Secondary:        #00D4AA   (teal-green for success/paid states)
  Danger:           #FF5757   (coral red for errors/unpaid)
  Warning:          #FFB547   (amber for partial/alerts)
  Text Primary:     #1A1D2E
  Text Secondary:   #6B7280
  Text Muted:       #9CA3AF
  Border:           #E5E7EB
  Divider:          #F3F4F6

Dark Mode:
  Background:       #0F0F1A   (deep navy-black)
  Surface:          #1A1B2E   (dark navy)
  Surface Raised:   #1E2035
  Primary:          #7C75FF   (slightly lighter for contrast)
  Primary Light:    #2D2B4E
  Secondary:        #00E5B8
  Danger:           #FF6B6B
  Warning:          #FFD166
  Text Primary:     #F1F2F6
  Text Secondary:   #A8AABC
  Text Muted:       #5C5F7A
  Border:           #2D2F45
  Divider:          #23243A
```

#### Typography

```
Font Family: "Inter" (body/UI) + "Poppins" (headings)

Scale:
  Display:  32px / Poppins Bold
  H1:       28px / Poppins SemiBold
  H2:       24px / Poppins SemiBold
  H3:       20px / Poppins Medium
  H4:       18px / Inter SemiBold
  Body L:   16px / Inter Regular
  Body M:   14px / Inter Regular
  Body S:   12px / Inter Regular
  Label:    12px / Inter Medium / 0.5px letter-spacing / UPPERCASE
  Mono:     14px / "JetBrains Mono" (invoice numbers, currency amounts)
```

#### Spacing Scale

```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64  (multiples of 4)
```

#### Border Radius

```
xs:   4px    (tags, chips)
sm:   8px    (inputs, small cards)
md:   12px   (cards)
lg:   16px   (modals, bottom sheets)
xl:   24px   (FAB, pill buttons)
full: 9999px (badges, avatars)
```

#### Elevation / Shadows (Light Mode)

```
card:     0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)
elevated: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)
overlay:  0 20px 60px rgba(0,0,0,0.20)
```

#### Glassmorphism Style

Applied to modals, hero cards, and gradient headers:

```
background:           rgba(255,255,255,0.72)   /* light mode */
background:           rgba(15,15,26,0.80)       /* dark mode  */
backdrop-filter:      blur(20px)
-webkit-backdrop-filter: blur(20px)
border:               1px solid rgba(255,255,255,0.20)
```

---

### 3.2 Component Library

| Component           | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `GlassCard`         | Frosted glass background, rounded, shadow                   |
| `GradientHeader`    | LinearGradient screen headers with blur                     |
| `PrimaryButton`     | Full-width, gradient fill, haptic feedback, loading state   |
| `OutlineButton`     | Border only, transparent fill                               |
| `TextButton`        | No border, inline text action                               |
| `ThemedInput`       | Floating label, error state, icon prefix/suffix             |
| `SearchBar`         | Animated expand-on-focus, clear button                      |
| `StatusBadge`       | Color-coded pill: Paid=teal · Unpaid=red · Partial=amber    |
| `Avatar`            | Initials with auto-color + image fallback                   |
| `SwipeableListItem` | Swipe-to-reveal Edit and Delete actions                     |
| `BottomSheet`       | Animated slide-up modal with backdrop blur                  |
| `Toast`             | Top-edge auto-dismiss notification                          |
| `EmptyState`        | Illustration + message + CTA                                |
| `SkeletonLoader`    | Shimmer placeholder during loading                          |
| `AmountDisplay`     | Large monospaced currency display                           |
| `SyncIndicator`     | Live sync status badge (synced / syncing / offline / error) |
| `FAB`               | Floating action button + expandable speed-dial menu         |
| `SegmentedControl`  | Tab-style toggle (Daily/Weekly/Monthly)                     |
| `DatePicker`        | Custom bottom-sheet calendar picker                         |
| `ProductLineItem`   | Invoice line-item row with quantity stepper                 |
| `MetricCard`        | KPI card with icon, value, trend percentage                 |

---

### 3.3 Animation Guidelines

| Interaction            | Animation                                     |
| ---------------------- | --------------------------------------------- |
| Screen push transition | Shared element: invoice card → invoice detail |
| List mount             | Staggered fade-in (Reanimated entering)       |
| Card press             | `withSpring` scale 0.97 + shadow drop         |
| Modal appear           | Slide up from bottom with spring physics      |
| Dashboard totals       | Count-up number animation on mount            |
| Sync icon              | Continuous rotation when syncing              |
| Delete swipe           | Red background + trash icon reveal            |
| Page header            | Parallax collapse on scroll                   |
| Tab switch             | Fade cross-dissolve                           |
| Error shake            | `withSequence` horizontal shake               |

---

## 4. Screen-by-Screen Design & Navigation

---

### Screen 01 · Splash Screen

**Purpose:** Brand impression and session check during app initialization.

**UI Layout:**

- Full-screen gradient: Primary → Primary Dark
- Centered animated logo (scale + fade in)
- "InvoiceFlow" wordmark below logo
- Tagline: "Professional Billing, Simplified"
- 3-dot pulse loader while checking session

**Initialization Logic:**

1. `initDatabase()` — open and migrate SQLite
2. `account.get()` — check Appwrite session
3. If session valid + business exists → Dashboard
4. If session valid + no business → Business Setup
5. If no session → Login

**Navigation Targets:**

- → `/(auth)/login` — no session
- → `/(main)/dashboard` — valid session, business configured
- → `/(auth)/business-setup` — valid session, first time

---

### Screen 02 · Login

**Purpose:** Email/password and phone OTP authentication.

**UI Layout:**

- Clean surface (no navigation bar)
- Small logo top-center with brand name
- Headline: "Welcome Back"
- **Segmented Control:** Email | Phone

_Email Tab:_

- Email input (`keyboardType="email-address"`)
- Password input (secure entry, show/hide toggle)
- "Forgot Password?" — right-aligned link
- "Log In" — primary gradient button
- Divider "or"
- "Create Account" — text button

_Phone Tab:_

- Country code picker + phone number input
- "Send OTP" — primary button
- After send: 6-box OTP input (auto-advance, auto-submit)
- 60-second resend countdown timer

**Navigation Targets:**

- → `/(auth)/signup`
- → `/(auth)/forgot-password`
- → `/(auth)/otp-verify` (after OTP sent)
- → `/(auth)/business-setup` (first login)
- → `/(main)/dashboard` (returning user)

---

### Screen 03 · Sign Up

**Purpose:** New user account creation.

**UI Layout:**

- Full name, email, password (with 4-level strength meter), confirm password
- T&C acknowledgement checkbox (required)
- "Create Account" primary button
- "Already have an account? Log in" link

**Actions:**

- `account.create()` → auto-login → Business Setup

---

### Screen 04 · Business Setup (3-Step Onboarding)

**Purpose:** First-time configuration of business profile.

**UI Layout:**

- Progress indicator (3 steps, colored dots)

_Step 1 — Basic Info:_

- Business name (required), business type dropdown, phone, email

_Step 2 — Tax & Financial:_

- Country (auto-detect), state, currency (auto via country), GSTIN, tax type (GST/VAT/None)

_Step 3 — Brand Customization:_

- Logo upload (camera or gallery, with crop)
- Invoice prefix input (e.g., "INV")
- Color theme picker (5 presets)
- "Let's Go!" button

**Actions:**

- Creates `businesses` document in Appwrite with user permissions
- Stores `businessId` to MMKV + Zustand `businessStore`
- → `/(main)/dashboard`

---

### Screen 05 · Dashboard (Home Tab)

**Purpose:** Central hub showing business health at a glance.

**UI Layout:**

_Gradient Header:_

- Business logo + name (left), Notification bell with badge (right), Profile avatar (right)

_Business Switcher:_ Horizontal scrollable business name pills (if multi-business)

_KPI Cards Row (horizontal scroll, 2.5 peek):_

- Total Revenue this month (green)
- Unpaid Amount (red)
- Invoices This Month (blue)
- Total Customers (purple)
- Each: GlassCard, icon, count-up amount, % vs last month

_Quick Actions Row (4 icon buttons):_

- ➕ New Invoice | 👤 Add Customer | 📦 Add Product | 📊 Reports

_Recent Invoices (last 5):_

- Customer avatar, name, invoice number, amount, StatusBadge
- "See All" link → Invoices tab

_Revenue Bar Chart:_

- 7-day chart with gradient fill (Victory Native XL)
- Toggle: 7D / 30D / 90D

_Bottom Tab Bar:_

- 🏠 Home | 👥 Customers | ➕ (FAB) | 📄 Invoices | ⋯ More

**Navigation Targets:**

- ➕ → `/(main)/invoices/create`
- Invoice row → `/(main)/invoices/[id]`
- "See All" → Invoices tab
- Notification bell → `/(main)/notifications`
- Profile avatar → `/(main)/settings`

---

### Screen 06 · Customers List

**Purpose:** Browse and manage the customer directory.

**UI Layout:**

- Animated search bar (expands on focus)
- Filter chips: All | With Balance | VIP | Recent
- FlatList: Avatar (initials, auto-color), name, phone, outstanding balance (red if > 0)
- Swipe left: Edit (orange), Delete (red)

**Navigation Targets:**

- FAB ➕ → `/(main)/customers/new`
- Customer row → `/(main)/customers/[id]`
- Edit swipe → `/(main)/customers/[id]/edit`

---

### Screen 07 · Customer Detail

**Purpose:** Complete customer overview and transaction history.

**UI Layout:**

- 72px avatar (photo or initials), name, city
- Stats row: Total Invoices · Total Spent · Balance Due
- Action row: 📄 New Invoice | 📞 Call | ✉️ Email | ✏️ Edit
- Tabs: **Invoices** | **Statement** | **Info**

**Navigation Targets:**

- 📄 New Invoice → `/(main)/invoices/create?customerId=[id]`
- Invoice → `/(main)/invoices/[id]`
- ✏️ Edit → `/(main)/customers/[id]/edit`

---

### Screen 08 · Products List

**Purpose:** Browse and manage the product/service catalog.

**UI Layout:**

- Search bar + filter chips: All | Products | Services | Low Stock
- View toggle: List ↔ Grid (icon in header)
- Product card: image tile, name, price (monospace), stock status badge
- Swipe left: Edit, Delete

**Navigation Targets:**

- FAB ➕ → `/(main)/products/new`
- Product → `/(main)/products/[id]`

---

### Screen 09 · Create / Edit Invoice

**Purpose:** Core screen — build a new invoice.

**UI Layout:**

_Sticky Header Fields:_

- Customer selector (searchable bottom sheet) — left
- Invoice number (auto-filled, editable) + Date + Due Date — right

_Line Items Section:_

- "Add Item" → product search bottom sheet
- Each added line: product name, HSN, quantity stepper (− | n | +), unit price field (editable), tax rate, line total
- Long-press or swipe left to remove item

_Live Summary Card (sticky bottom):_

- Subtotal, Discount (flat/% toggle), CGST, SGST / IGST, **Total** (bold)
- Status toggle: Unpaid | Partial | Paid

_Collapsible Notes & Terms Section_

_Bottom Action Bar:_

- "Preview PDF" (outline) | "Save Invoice" (primary gradient)

**Navigation Targets:**

- Customer selector → inline bottom sheet
- Add Item → inline product search bottom sheet
- "Preview PDF" → `/(main)/invoices/[id]/preview`
- "Save Invoice" → `/(main)/invoices/[id]`
- Back (with items added) → confirmation dialog → Invoices list

---

### Screen 10 · Invoice Detail

**Purpose:** Full invoice view with payment recording and sharing.

**UI Layout:**

- Full-width status stripe (red=unpaid, green=paid, amber=partial, gray=cancelled)
- Invoice number (large monospace), date, due date
- Customer name + city
- Line items table: Item | Qty | Rate | Tax | Amount
- Summary table: Subtotal, Discount, Tax breakdown, **Total**, Paid, **Balance Due**
- Action row: 📤 Share | 👁️ Preview | ✏️ Edit | 📋 Clone | ❌ Cancel
- Payment input card (if unpaid/partial): amount, method, "Record Payment"
- Payment history list (if partial)

**Navigation Targets:**

- ✏️ Edit → `/(main)/invoices/[id]/edit`
- 📋 Clone → creates draft → `/(main)/invoices/[draft-id]/edit`
- 📤 Share → generate PDF → native share sheet
- 👁️ Preview → `/(main)/invoices/[id]/preview`
- Back → Invoices list

---

### Screen 11 · Invoice PDF Preview

**Purpose:** Full-screen rendered invoice PDF before sharing or printing.

**UI Layout:**

- Full-screen WebView (HTML → PDF via expo-print)
- Toolbar: ✕ Close | ⬇️ Download | 📤 Share | 🖨️ Print
- Professional template:
  - Business logo (top-left) + business details (top-right)
  - Gradient divider
  - Bill To section
  - Line items table with tax
  - GST summary table
  - UPI QR code + amount in words
  - Signature + footer

**Navigation Targets:**

- Download → device Downloads folder
- Share → native share sheet
- Print → AirPrint / Cloud Print
- ✕ → back to Invoice Detail

---

### Screen 12 · Invoices List

**Purpose:** Browse, search, and filter all invoices.

**UI Layout:**

- Search bar + filter chips: All | Unpaid | Paid | Partial | Overdue
- Mini stats strip: Total | Paid | Unpaid
- Invoice rows: customer avatar, name, invoice number, date, amount, StatusBadge
- Overdue rows: red left-border accent

**Navigation Targets:**

- Invoice row → `/(main)/invoices/[id]`
- FAB ➕ → `/(main)/invoices/create`

---

### Screen 13 · Reports

**Purpose:** Financial analytics and summaries.

**UI Layout:**

- Period selector: Daily | Weekly | Monthly | Custom
- Revenue line chart with gradient fill (Victory Native XL)
- Stats card row: Total Revenue | Tax Collected | Outstanding | Invoice Count
- Tabs: **Summary** | **Tax Report** | **Customers** | **Products**
- Export button (top-right): PDF or CSV

**Navigation Targets:**

- Customer row → `/(main)/customers/[id]`
- Product row → `/(main)/products/[id]`
- Export → share sheet

---

### Screen 14 · Inventory Management

**Purpose:** Monitor and adjust stock levels.

**UI Layout:**

- Amber alert banner when low-stock items exist
- Filter chips: All | Low Stock | Out of Stock | In Stock
- Product rows: name, SKU, stock qty, unit, colored progress bar
- Tap row → Stock Adjustment bottom sheet

_Stock Adjustment Sheet:_

- Current quantity display, +/− input, reason dropdown, notes, "Update Stock"

**Navigation Targets:**

- Product row → `/(main)/products/[id]`
- Back → More / Settings

---

### Screen 15 · Staff Management

**Purpose:** Invite and manage team members.

**UI Layout:**

- Staff list: avatar, name, email, role badge, last active
- Swipe left: Deactivate | Remove
- "Invite Staff" button → bottom sheet:
  - Email input, role selector, permission checkboxes, "Send Invite"

**Navigation Targets:**

- Staff row → `/(main)/settings/staff/[id]`
- Back → Settings

---

### Screen 16 · Subscription & Plans

**Purpose:** Display current plan and upgrade options.

**UI Layout:**

- Current plan card: plan name, expiry, usage meter (invoices used)
- Three plan cards: Free | Pro | Enterprise
  - Price, feature checklist, action button
- Billing history list

**Actions:**

- "Choose Plan" → native IAP sheet → Appwrite Function validates → subscription updated

---

### Screen 17 · Notifications

**Purpose:** In-app notification center.

**UI Layout:**

- Sections: Today | Yesterday | Earlier
- Each row: color-coded icon by type, title, body, timestamp
- Unread rows: colored left-border accent
- "Mark All Read" button

**Navigation Targets:**

- Payment notification → `/(main)/invoices/[id]`
- Low stock notification → `/(main)/products/[id]`

---

### Screen 18 · Settings

**Purpose:** App and business configuration.

**Grouped Sections:**

_Business:_ Profile · Invoice Templates · Tax Settings  
_Team:_ Staff Management · Permissions  
_Account:_ My Profile · Change Password · Linked Accounts  
_Plan & Billing:_ Subscription · Billing History  
_Data:_ Cloud Backup · Export · Import  
_App:_ Appearance (Dark/Light/System) · Language · Notifications · App Lock (Biometric)  
_Support:_ FAQ · Contact · Rate App  
_Danger Zone:_ Delete Business · Delete Account  
_Footer:_ App version · Build number · Log Out

---

## 5. Navigation Architecture

### 5.1 Route Tree

```
Root _layout.tsx  (session gate)
│
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   ├── otp-verify.tsx
│   ├── forgot-password.tsx
│   └── business-setup.tsx
│
└── (main)/
    ├── _layout.tsx            ← Bottom Tab Navigator
    ├── dashboard.tsx          [Tab 1: Home]
    ├── notifications.tsx
    ├── customers/
    │   ├── index.tsx          [Tab 2: Customers list]
    │   ├── new.tsx            [Modal]
    │   └── [id]/
    │       ├── index.tsx      [Detail]
    │       └── edit.tsx
    ├── products/
    │   ├── index.tsx          [Tab 3 via More: Products list]
    │   ├── new.tsx            [Modal]
    │   └── [id]/
    │       ├── index.tsx
    │       └── edit.tsx
    ├── invoices/
    │   ├── index.tsx          [Tab 4: Invoices list]
    │   ├── create.tsx         [Modal]
    │   └── [id]/
    │       ├── index.tsx      [Detail]
    │       ├── edit.tsx
    │       └── preview.tsx
    ├── reports/
    │   └── index.tsx
    ├── inventory/
    │   └── index.tsx
    └── settings/
        ├── index.tsx
        ├── business.tsx
        ├── templates.tsx
        ├── tax.tsx
        ├── staff/
        │   ├── index.tsx
        │   └── [id].tsx
        ├── subscription.tsx
        └── backup.tsx
```

### 5.2 Bottom Tab Bar

```
┌──────────────────────────────────────────────┐
│  🏠 Home  │  👥 Clients  │  ⊕  │  📄 Bills  │  ⋯  │
└──────────────────────────────────────────────┘
                       ↑
             Center ⊕ is an elevated FAB
             Opens speed-dial bottom sheet:
               • Create Invoice
               • Add Customer
               • Add Product
```

### 5.3 Navigation Flow Map

#### New Invoice (Primary Journey)

```
Dashboard ──[New Invoice]──► invoices/create
                                │
              [Customer Selector bottom sheet]
              [Add Items bottom sheet]
                                │
                         [Save Invoice]
                                ▼
                      invoices/[id] (Detail)
                          │           │
                   [Preview PDF]    [Edit]
                          ▼           ▼
                  invoices/[id]/  invoices/[id]/
                  preview         edit
                          │
               [Share] → native share sheet
               [Back]  → invoices/[id]
```

#### Customer → Invoice

```
Customers List ──► customers/[id]
                        │
               [New Invoice button]
                        ▼
            invoices/create?customerId=[id]
            (customer pre-filled)
```

#### Auth Flow

```
Splash
  ├── [valid session + business] ──► dashboard
  ├── [valid session, no business] ──► business-setup ──► dashboard
  └── [no session] ──► login
                          ├── [email] ──► dashboard
                          ├── [OTP] ──► otp-verify ──► dashboard
                          ├── [new] ──► signup ──► business-setup ──► dashboard
                          └── [forgot] ──► forgot-password ──► (email sent) ──► login
```

#### Settings Deep Navigation

```
Settings
  ├── Business Profile ──► settings/business ──[save]──► settings
  ├── Staff ──► settings/staff
  │               └── [invite bottom sheet inline]
  │               └── [id] ──► settings/staff/[id]
  └── Subscription ──► settings/subscription
                            └── [IAP sheet] ──► (success) ──► settings
```

### 5.4 Back Navigation Rules

| From                      | Back Destination                          |
| ------------------------- | ----------------------------------------- |
| `invoices/create` (dirty) | Confirm dialog → Invoices List            |
| `invoices/[id]/edit`      | Invoice Detail                            |
| `invoices/[id]/preview`   | Invoice Detail                            |
| `customers/new`           | Customers List                            |
| `products/new`            | Products List                             |
| `business-setup`          | Not allowed (protected route)             |
| `settings/**`             | Previous settings screen or Settings root |
| Dashboard (tab)           | Android: minimize app (never to auth)     |

---

## 6. Application Architecture

### 6.1 Repository Pattern

```
React Native UI
      │
 Zustand Store ◄──── Realtime events (Appwrite WebSocket)
      │
 Repository Layer
      │
 ┌────┴────────────────────┐
 │                         │
SQLite (source of truth)  Sync Engine (background)
                               │
                          Appwrite SDK
                          (cloud backend)
```

### 6.2 Write Flow (Offline-Safe)

```
1. User action: Save Invoice
2. invoiceRepository.create(data)
3. Generate UUID locally (react-native-uuid)
4. INSERT INTO SQLite invoices (isSynced = 0)
5. INSERT INTO SQLite sync_queue (operation = 'create')
6. Optimistic update: invoiceStore.addInvoice(invoice)
7. UI navigates immediately (no waiting for network)
8. [Background] NetInfo.addEventListener detects online
9. syncService.pushChanges()
10. Appwrite.createDocument(id, payload, permissions)
11. Success → DELETE from sync_queue, UPDATE isSynced = 1
12. Failure → keep in queue, exponential backoff: 30s → 1m → 5m → 15m
```

### 6.3 Read Flow

```
1. Screen mounts → invoiceRepository.list(businessId)
2. SELECT FROM SQLite → returns immediately (synchronous)
3. UI renders with local data
4. [If online] syncService.pullChanges()
5. Fetch Appwrite documents WHERE $updatedAt > lastSyncTimestamp
6. INSERT OR REPLACE into SQLite (upsert)
7. Zustand store refreshes → UI re-renders
```

### 6.4 Multi-Tenant Isolation

Every document satisfies:

1. `businessId` field matches active business
2. Every Appwrite query includes `Query.equal('businessId', businessId)`
3. `Permission.read/write(Role.user(ownerId))` on every document

### 6.5 Error Handling

```typescript
// Normalized error wrapper in every repository method
try {
  const result = await operation();
  return { data: result, error: null };
} catch (err) {
  const parsed = parseAppwriteError(err);
  logError(parsed); // Sentry in prod, console in dev
  return { data: null, error: parsed };
}
```

---

## 7. Database Schema

For the complete, attribute-level schema for all 9 Appwrite collections  
_(businesses, customers, products, invoices, invoice_items, subscriptions, staff_roles, backups, notifications)_  
including all indexes, permissions, and example documents, see:

📄 **[APPWRITE.md → Section 6](./APPWRITE.md#6-create-collections--schemas)**

### Local SQLite Schema

Mirrors Appwrite collections with two extra columns on every table:

```sql
isSynced   INTEGER DEFAULT 1  -- 0 = pending upload to Appwrite
-- plus the sync_queue table:

CREATE TABLE IF NOT EXISTS sync_queue (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  collection   TEXT    NOT NULL,
  documentId   TEXT    NOT NULL,
  operation    TEXT    NOT NULL,   -- 'create' | 'update' | 'delete'
  payload      TEXT,               -- JSON string
  retryCount   INTEGER DEFAULT 0,
  nextRetryAt  INTEGER,            -- Unix timestamp
  createdAt    INTEGER DEFAULT (strftime('%s', 'now'))
);
```

---

## 8. Appwrite Functions Plan

_Full source code templates: [APPWRITE.md → Section 9](./APPWRITE.md#9-create-appwrite-functions)_

| Function ID                | Runtime    | Trigger                  | Purpose                                            |
| -------------------------- | ---------- | ------------------------ | -------------------------------------------------- |
| `monthly-report-generator` | Node.js 20 | CRON `0 1 1 * *`         | Aggregate invoices → monthly_reports collection    |
| `analytics-calculator`     | Node.js 20 | CRON `0 2 * * *` + HTTP  | Top customers/products, revenue trends             |
| `stock-deduction`          | Node.js 20 | DB Event: invoice create | Deduct stock, create low-stock notification        |
| `subscription-validator`   | Node.js 20 | HTTP POST                | Validate IAP receipt (Apple/Google), activate plan |
| `backup-creator`           | Node.js 20 | HTTP POST                | Export business data → ZIP → backups bucket        |
| `cleanup-old-data`         | Node.js 20 | CRON `0 3 * * 0`         | Remove old notifications, expired backups          |

---

## 9. Frontend Folder Structure

```
src/
│
├── app/                            # Expo Router file-based routing
│   ├── _layout.tsx                 # Root: session guard
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── otp-verify.tsx
│   │   ├── forgot-password.tsx
│   │   └── business-setup.tsx
│   └── (main)/
│       ├── _layout.tsx             # Bottom tab navigator
│       ├── dashboard.tsx
│       ├── notifications.tsx
│       ├── customers/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── [id]/
│       │       ├── index.tsx
│       │       └── edit.tsx
│       ├── products/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── [id]/
│       │       ├── index.tsx
│       │       └── edit.tsx
│       ├── invoices/
│       │   ├── index.tsx
│       │   ├── create.tsx
│       │   └── [id]/
│       │       ├── index.tsx
│       │       ├── edit.tsx
│       │       └── preview.tsx
│       ├── reports/
│       │   └── index.tsx
│       ├── inventory/
│       │   └── index.tsx
│       └── settings/
│           ├── index.tsx
│           ├── business.tsx
│           ├── templates.tsx
│           ├── tax.tsx
│           ├── staff/
│           │   ├── index.tsx
│           │   └── [id].tsx
│           ├── subscription.tsx
│           └── backup.tsx
│
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── GradientHeader.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── OutlineButton.tsx
│   │   ├── TextButton.tsx
│   │   ├── ThemedInput.tsx
│   │   ├── SearchBar.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Avatar.tsx
│   │   ├── SwipeableListItem.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── AmountDisplay.tsx
│   │   ├── SyncIndicator.tsx
│   │   └── FAB.tsx
│   ├── forms/
│   │   ├── CustomerForm.tsx
│   │   ├── ProductForm.tsx
│   │   └── InvoiceForm.tsx
│   ├── invoice/
│   │   ├── InvoiceCard.tsx
│   │   ├── LineItemRow.tsx
│   │   ├── InvoiceSummary.tsx
│   │   └── PDFTemplate.tsx         # HTML template string for expo-print
│   └── charts/
│       ├── RevenueChart.tsx
│       └── MetricCard.tsx
│
├── services/
│   ├── appwrite.ts                 # Client init, exports
│   ├── authService.ts              # Login, register, OTP, logout
│   ├── database.ts                 # SQLite init + helpers
│   ├── syncService.ts              # Push/pull sync engine
│   ├── pdfService.ts               # Generate PDF via expo-print
│   ├── notificationService.ts      # Push + in-app notifications
│   └── storageService.ts           # File upload/download/preview
│
├── repositories/                   # Data access abstraction layer
│   ├── businessRepository.ts
│   ├── customerRepository.ts
│   ├── productRepository.ts
│   └── invoiceRepository.ts
│
├── store/                          # Zustand global state
│   ├── authStore.ts
│   ├── businessStore.ts
│   ├── customerStore.ts
│   ├── productStore.ts
│   ├── invoiceStore.ts
│   ├── uiStore.ts
│   └── syncStore.ts
│
├── hooks/
│   ├── useColorScheme.ts
│   ├── useThemeColor.ts
│   ├── useInvoiceCalculations.ts   # GST math, totals, discounts
│   ├── useRealtimeInvoices.ts      # Appwrite Realtime subscription
│   ├── useDebounce.ts
│   ├── useNetworkStatus.ts
│   └── useBiometricAuth.ts
│
├── utils/
│   ├── currency.ts                 # Format amounts, symbols
│   ├── gst.ts                      # CGST/SGST/IGST split logic
│   ├── dateHelpers.ts
│   ├── invoiceNumbering.ts         # Auto-increment INV-2026-001
│   ├── validation.ts               # Zod schemas for all entities
│   ├── errorParser.ts              # Normalize Appwrite error codes
│   └── amountInWords.ts            # "Five Thousand Rupees Only"
│
├── constants/
│   ├── theme.ts                    # Design system: colors, spacing, fonts
│   ├── routes.ts                   # Route path constants
│   ├── queryKeys.ts                # TanStack Query key factory
│   └── planLimits.ts               # Free/Pro/Enterprise limits
│
└── types/
    ├── index.ts                    # All interfaces and enums
    ├── navigation.ts               # Typed Expo Router params
    └── appwrite.ts                 # Appwrite document types
```

---

## 10. State Management Design

### Zustand Stores

```typescript
// authStore
interface AuthStore {
  user: Models.User | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

// businessStore
interface BusinessStore {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (id: string) => void;
  fetchBusinesses: () => Promise<void>;
}

// invoiceStore (optimistic updates)
interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  fetchInvoices: (businessId: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => void; // optimistic add
  updateInvoice: (invoice: Invoice) => void; // realtime / manual update
  removeInvoice: (id: string) => void; // optimistic delete
}

// syncStore
interface SyncStore {
  status: "idle" | "syncing" | "error" | "offline";
  pendingCount: number;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;
}

// uiStore
interface UIStore {
  theme: "light" | "dark" | "system";
  language: "en" | "hi" | "mr";
  setTheme: (t: UIStore["theme"]) => void;
  toasts: Toast[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}
```

### TanStack Query (Server-Only Data)

Used for analytics and reports only — data not cached in Zustand:

```typescript
// Monthly report
const { data: report } = useQuery({
  queryKey: ["reports", "monthly", businessId, month],
  queryFn: () => reportService.getMonthlyReport(businessId, month),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Subscription status
const { data: sub } = useQuery({
  queryKey: ["subscription", userId],
  queryFn: () => subscriptionService.getStatus(userId),
  staleTime: 60 * 60 * 1000, // 1 hour
});
```

---

## 11. Offline-First Architecture

### Sync Engine

```
Triggers:
  • App comes to foreground (AppState event)
  • Network reconnects (NetInfo event)
  • Manual pull-to-refresh on any list screen
  • After every local write (auto-trigger with 2s debounce)

pushChanges():
  1. SELECT * FROM sync_queue WHERE nextRetryAt <= now()
  2. For each item: call Appwrite create / update / delete
  3. Success  → DELETE from sync_queue
  4. Conflict → fetch remote, merge (last-write-wins by $updatedAt)
  5. Network  → exponential backoff: 30s → 1m → 5m → 15m → 1h

pullChanges():
  1. Read lastSyncTimestamp from MMKV
  2. Appwrite listDocuments WHERE $updatedAt > lastSyncTimestamp
  3. For each result: INSERT OR REPLACE into SQLite
  4. Write lastSyncTimestamp = now() to MMKV
```

### Conflict Resolution

| Scenario                           | Strategy                                           |
| ---------------------------------- | -------------------------------------------------- |
| Normal field update                | Last-Write-Wins (`$updatedAt` comparison)          |
| Invoice status                     | Never downgrade: `paid` > `partial` > `unpaid`     |
| Stock quantity                     | Sum of remote + local delta (merge, not overwrite) |
| Deleted remotely, modified locally | Remote delete wins; show user notification         |

### Sync Status Indicator

Shown in all main screens (top-right corner badge):

| 状態    | Color | Icon | Message                           |
| ------- | ----- | ---- | --------------------------------- |
| Synced  | Green | ✓    | "Up to date"                      |
| Syncing | Blue  | 🔄   | "Syncing 3 items..."              |
| Offline | Amber | 📶   | "Offline — changes saved locally" |
| Error   | Red   | ⚠️   | "Sync error — tap to retry"       |

---

## 12. Tech Stack & Dependencies

### Install Commands

```bash
# Core navigation & expo
npx expo install expo-router expo-sqlite expo-secure-store expo-file-system

# Appwrite
npx expo install appwrite

# Animations & gestures
npx expo install react-native-reanimated react-native-gesture-handler

# State management
npm install zustand @tanstack/react-query

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# PDF
npx expo install expo-print expo-sharing

# Charts
npm install victory-native

# Fast key-value storage
npm install react-native-mmkv

# Network
npx expo install @react-native-community/netinfo

# Media & UI
npx expo install expo-image-picker expo-image-manipulator expo-blur expo-haptics

# Notifications
npx expo install expo-notifications expo-device

# Localization
npm install i18next react-i18next

# Utilities
npm install react-native-uuid date-fns

# Fonts
npx expo install expo-font @expo-google-fonts/inter @expo-google-fonts/poppins
```

### Peer Dependency Versions (confirmed compatible with Expo SDK 54)

| Package                 | Version |
| ----------------------- | ------- |
| react-native            | 0.76+   |
| expo                    | ~54.0.0 |
| appwrite                | ^17.0.0 |
| zustand                 | ^5.0.0  |
| @tanstack/react-query   | ^5.0.0  |
| react-native-reanimated | ~4.1.0  |
| react-native-mmkv       | ^3.0.0  |
| victory-native          | ^41.0.0 |

---

_InvoiceFlow v2 — Technical Blueprint_  
_For Appwrite backend setup, refer to [APPWRITE.md](./APPWRITE.md)_  
_This document covers: UI redesign · Feature set · Navigation flows · Architecture · Schema · Functions · Folder structure_
