# Khutta CPE Pro (خطى) — Technical Documentation

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS 11](https://img.shields.io/badge/NestJS_11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Full-stack Continuing Professional Education (CPE) assessment, credentialing, and digital verification platform for accounting, audit, and governance professionals.**

</div>

---

## 📌 System Overview

Maintaining professional certifications (**CPA / SOCPA, CIA, CMA, CISA, and CFE**) requires earning accredited Continuing Professional Education (CPE) credit hours annually. **Khutta CPE Pro** replaces passive video lectures with a competency-based assessment and credentialing engine.

The platform is engineered as a full-stack TypeScript monorepo consisting of:
1. **`certificates/` (Frontend SPA):** An RTL-first React 19 + Vite 8 application providing the assessment environment, multi-track bundle management, regulatory date configuration, and client-side A4 landscape PDF certificate rendering.
2. **`certificates-backend/` (Backend API):** A modular NestJS 11 + Prisma 7 + PostgreSQL REST API enforcing assessment lock state machines, credential issuance, regulatory date validation, and public certificate verification.
3. **`shared/` (Shared Contract Library):** Isomorphic TypeScript DTOs, interfaces, and tier metric definitions shared between the client and server.

---

## ✨ Platform Features

- **⚡ Multi-Tier Competency Assessment Engine:**
  - Supports five professional certification tracks (`CIA`, `CMA`, `CPA`, `CFE`, `CISA`), each offering topic-specific tests across three standardized variant tiers (`SMALL`, `MEDIUM`, `LARGE`).
  - Timed assessment runner (`TestTaking.tsx`) featuring Honor Code verification, question flagging, question navigation grid, countdown timer, and instant grading with unlimited retakes.
- **💾 Resilient Client-Side Draft Persistence:**
  - Automatically persists active exam state (`phase`, `currentQ`, `answers`, `flagged`, `honorCode`, and absolute `expirationTime`) to `localStorage` (`test_draft_<variantId>`) and purges stale drafts from previous sessions.
- **🔒 Mutual-Exclusion Lock State Machine (Individual vs. Bundle):**
  - Supports both standalone test completion (`ActiveIndividualTest`) and multi-test custom bundles (`ActiveBundle` + `ActiveBundleItem`), enforcing strict mutual exclusion so a user has at most one active workflow locked at a time.
- **📜 Atomic Credential Issuance & CPE Hour Accumulation:**
  - Upon fulfillment (`POST /payments/pay`), the backend atomically issues `UserCertificate` records, increments the user's cumulative `totalCpeHours`, and releases active locks.
- **📅 Regulatory Training Date Alignment & Anti-Tamper Lock:**
  - Interactive RTL calendar and duration selector (`CustomDatePicker.tsx`) allowing users to configure training `startDate` and `endDate` within the accredited hour window, automatically deriving `issueDate = endDate + 2 days`, and permanently locking the dates once committed.
- **🔍 Deterministic Public Verification & QR Audit Trail:**
  - Every issued certificate receives a deterministic public short code (`KH` + last 8 characters of its ULID, displayed as `KH-XXXX-XXXX`) and a dynamic QR code linking to the public verification endpoint (`/certificate/:identifier`).
- **🖨️ High-Resolution Bilingual Certificate Rendering & PDF Export:**
  - Renders an A4 landscape (`1.414:1` aspect ratio) certificate (`CertificateTemplate` in `CertificateView.tsx`) and exports a 5x pixel-ratio PNG embedded into an A4 landscape PDF via `html-to-image` and `jsPDF`.
- **🌐 RTL-First Arabic UI with Bilingual Credential Support:**
  - Native Arabic RTL interface (`Tajawal` headings + `IBM Plex Sans Arabic` body) paired with strict Latin name validation on user profiles to ensure standardized international English certificate rendering.

---

## ⚖️ Implemented Business Rules & Domain Invariants

### 1. Assessment Tiers & Credit Hour Invariants
Defined in `shared/pricing.ts` (`TIER_METRICS`) and enforced across both frontend and backend:
- **`SMALL` Tier:** `10 questions` | `10 minutes` duration | **`2.0 CPE credit hours`**
- **`MEDIUM` Tier:** `20 questions` | `20 minutes` duration | **`4.0 CPE credit hours`**
- **`LARGE` Tier:** `30 questions` | `30 minutes` duration | **`6.0 CPE credit hours`**
- **Core Invariants:**
  - Assessment duration in minutes always equals the number of questions (`1 minute per question`).
  - Every `5 questions` (and `5 minutes` of assessment) corresponds to `1.0 CPE credit hour`.

### 2. Passing Threshold, Grading & Retake Rules
- **Passing Score:** A minimum score of **70%** (`score / totalGradable >= 0.7`) is required to pass any assessment variant.
- **Unlimited Retakes:** If a user scores below 70% or the countdown timer expires without meeting the threshold, no lock is created and the user may retry the assessment immediately without restriction.
- **Honor Code Gate:** Users cannot transition from the pre-test phase (`phase === "pre"`) to the active timed phase (`phase === "test"`) without explicitly checking the Honor Code attestation.

### 3. Mutual-Exclusion Lock Rules (`ActiveIndividualTest` vs. `ActiveBundle`)
Enforced by `@unique` `userId` constraints in PostgreSQL (`schema.prisma`) and service guards in `BundlesService`, `IndividualTestsService`, and `PaymentsService`:
- **Single Active Lock Invariant:** A user can hold at most **one** active lock at any point in time — either an `ActiveIndividualTest` or an `ActiveBundle`, never both.
- **Individual Assessment Lock (`ActiveIndividualTest`):**
  - Created automatically when a user passes a standalone assessment (`POST /individual-tests/finish`).
  - While active, the user is blocked from starting any other assessment or confirming a bundle until the lock is either fulfilled (`POST /payments/pay`) or canceled (`DELETE /individual-tests/cancel`).
- **Bundle Lock (`ActiveBundle` & `ActiveBundleItem`):**
  - Created when a user confirms a cart of one or more unique `testVariantId` items (`POST /bundles/confirm`).
  - While an `ActiveBundle` exists, the user can only access and take assessments that belong to `ActiveBundle.items`. Attempting to access any `testVariantId` outside the bundle is blocked.
  - Passing a bundle test calls `POST /bundles/progress`, marking that specific `ActiveBundleItem.finished = true` and recording `finishedAt`.
  - **All-Items Completion Gate:** Fulfillment (`POST /payments/pay`) is strictly rejected (`400 Bad Request`) unless `activeBundle.items.every(item => item.finished === true)`.
  - **Bundle Cancellation:** Canceling an active bundle (`DELETE /bundles/cancel`) deletes the `ActiveBundle` record and cascades deletion to all associated `ActiveBundleItem` progress records.

### 4. Certificate Issuance & Initial State Rules
- **Deferred Issuance:** `UserCertificate` records are only created during fulfillment (`POST /payments/pay`) after the required assessment(s) have been passed.
- **Initial Unconfigured Dates:** Newly created `UserCertificate` records are initialized with `startDate = null`, `endDate = null`, and `issueDate = null`.
- **CPE Credit Accumulation:** Issuing a certificate atomically increments `User.totalCpeHours` by the variant's accredited hours (`2`, `4`, or `6`).
- **Viewing & Export Guard:** A certificate with `startDate === null || endDate === null || issueDate === null` cannot be viewed on `/certificate/:identifier` or exported to PDF until its training dates are configured and locked.

### 5. Regulatory Date Customization & Immutability Rules
Enforced identically in `CustomDatePicker.tsx` (client) and `CertificatesService.updateDates` (`PATCH /certificates/:id/dates` on the server):
1. **Presence & Ownership:** Only the owning `userId` can set `startDate` and `endDate`, and both dates must be provided together.
2. **Training Duration Window (`1 <= diffDays <= maxAllowedDays`):**
   - Evaluated at local midnight boundaries (`endMidnight - startMidnight`).
   - Minimum duration: **1 day** (`endDate` must be at least 1 calendar day after `startDate`).
   - Maximum duration: **`variant.hours` days** (max `2 days` for `SMALL`, `4 days` for `MEDIUM`, `6 days` for `LARGE`).
3. **Automatic Issue Date Derivation (`issueDate = endDate + 2 days`):**
   - `issueDate` is never accepted from client input; it is deterministically computed as `endMidnight + 2 calendar days`.
4. **No Future Issuance Constraint (`issueDate <= todayMidnight`):**
   - The derived `issueDate` cannot fall in the future (after today's date). Consequently, the latest selectable `endDate` is `today - 2 days`.
5. **Permanent Anti-Tamper Lock (Write-Once Immutability):**
   - If `cert.startDate !== null && cert.endDate !== null`, any subsequent call to `PATCH /certificates/:id/dates` throws a `400 Bad Request` exception. Once locked, certificate dates are permanently immutable.

### 6. Identity & Public Verification Rules
- **Latin Name Validation:** Registration (`Register.tsx` / `AuthService`) and profile updates (`Profile.tsx`) validate `firstName` and `lastName` against `/^[A-Za-z\s'-]+$/` so that official English certificates render valid Latin characters.
- **Deterministic Certificate Numbering:**
  - `deriveCertificateNumber(ulid)` generates a 10-character uppercase code: `'KH' + ulid.slice(-8).toUpperCase()`.
  - `CertificateResponseDto` formats this code for display as `KH-XXXX-XXXX`.
- **Flexible Public Lookup:** `GET /certificates/:identifier` normalizes the lookup parameter (`.toUpperCase().replace(/-/g, '')`) and queries by `OR: [{ id: identifier }, { certificateNumber: normalized }]`, allowing case-insensitive and hyphen-tolerant verification via URL or QR scan.

---

## 🔄 Core Technical Workflows

```
┌──────────────────┐     ┌─────────────────────────┐     ┌────────────────────────┐
│  1. Auth &       │     │  2. Mode Selection      │     │  3. Timed Assessment   │
│  Onboarding      │────▶│  • Individual Variant   │────▶│  • Honor Code Gate     │
│  (JWT Cookie)    │     │  • Locked Custom Bundle │     │  • Auto-Saved Drafts   │
└──────────────────┘     └─────────────────────────┘     └───────────┬────────────┘
                                                                     │
                                                           Pass (>= 70% Score)
                                                                     │
                                                                     ▼
┌──────────────────┐     ┌─────────────────────────┐     ┌────────────────────────┐
│  6. Public QR    │     │  5. Date Configuration  │     │  4. Lock Fulfillment   │
│  Verification &  │◀────│  • 1..hours Days Window │◀────│  • Issue Certificates  │
│  A4 PDF Export   │     │  • Issue = End + 2 Days │     │  • Increment CPE Hours │
│  (KH-XXXX-XXXX)  │     │  • Write-Once Lock      │     │  • Clear Active Lock   │
└──────────────────┘     └─────────────────────────┘     └────────────────────────┘
```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

| Model | Primary Key | Key Fields & Relations | Purpose |
| :--- | :--- | :--- | :--- |
| **`User`** | `id` (ULID) | `email` (`@unique`), `password` (bcrypt), `firstName`, `lastName`, `jobTitle`, `company`, `experienceYears`, `totalCpeHours` | Stores user identity, professional metadata, and cumulative CPE credits. |
| **`Test`** | `id` (ULID) | `arabicTitle`, `englishTitle`, `cert` (`CertType`), `desc`, `questions[]`, `variants[]` | Master certification topic definition and question bank. |
| **`TestVariant`** | `id` (ULID) | `testId`, `tierName` (`SMALL` \| `MEDIUM` \| `LARGE`) | Specific assessment tier variant associated with a `Test`. |
| **`Question`** | `id` (ULID) | `text`, `options` (`Json`), `testId` | Multiple-choice question belonging to a `Test`. |
| **`ActiveIndividualTest`** | `id` (ULID) | `userId` (`@unique`), `testVariantId`, `createdAt` | Tracks a passed standalone assessment awaiting fulfillment. |
| **`ActiveBundle`** | `id` (ULID) | `userId` (`@unique`), `createdAt`, `items[]` | Tracks a locked multi-test bundle in progress or awaiting fulfillment. |
| **`ActiveBundleItem`** | `id` (ULID) | `bundleId`, `testVariantId`, `finished` (`Boolean`), `finishedAt` (`@@unique([bundleId, testVariantId])`) | Tracks per-variant completion status within an `ActiveBundle`. |
| **`UserCertificate`** | `id` (ULID) | `certificateNumber` (`@unique`), `userId`, `testVariantId`, `startDate`, `endDate`, `issueDate` | Official issued credential record and immutable training date audit trail. |

---

## 🔌 Backend API Modules (`certificates-backend/src`)

All protected endpoints use `JwtAuthGuard` reading the HTTP-only `access_token` cookie. Interactive OpenAPI/Swagger documentation is served at `/api`.

- **`AuthModule` (`/auth`):**
  - `POST /auth/register` — Creates user account with bcrypt password hashing and sets HTTP-only JWT cookie.
  - `POST /auth/login` — Authenticates credentials and sets HTTP-only JWT cookie.
  - `POST /auth/logout` — Clears authentication cookie.
  - `GET /auth/me` — Returns current authenticated user profile and CPE metrics.
  - `PATCH /auth/profile` — Updates personal/professional profile fields (`firstName`, `lastName`, `phoneNumber`, `jobTitle`, `company`, `experienceYears`).
  - `PATCH /auth/password` — Verifies current password and updates password hash.
- **`TestVariantsModule` (`/test-variants`):**
  - `GET /test-variants` — Paginated catalog of test variants filterable by certification track (`cert`).
  - `GET /test-variants/:id` — Returns variant details, attached tier metrics, and randomized/sliced question set for the tier.
- **`IndividualTestsModule` (`/individual-tests`):**
  - `GET /individual-tests/active` — Returns the user's `ActiveIndividualTest` lock if present.
  - `POST /individual-tests/finish` — Creates an `ActiveIndividualTest` lock upon passing a standalone test (guarded against existing bundle/individual locks).
  - `DELETE /individual-tests/cancel` — Cancels and deletes the user's `ActiveIndividualTest` lock.
- **`BundlesModule` (`/bundles`):**
  - `GET /bundles/active` — Returns the user's `ActiveBundle` lock with item completion status and aggregated hour metrics.
  - `POST /bundles/confirm` — Locks a new `ActiveBundle` for the given `variantIds`.
  - `POST /bundles/progress` — Marks a specific `testVariantId` as `finished` inside the user's active bundle.
  - `DELETE /bundles/cancel` — Cancels and deletes the user's `ActiveBundle` and all item progress.
- **`PaymentsModule` (`/payments`):**
  - `POST /payments/pay` — Validates lock completion eligibility, issues `UserCertificate` record(s), increments `User.totalCpeHours`, and deletes the active lock.
- **`CertificatesModule` (`/certificates`):**
  - `GET /certificates/my` — Paginated list of the authenticated user's earned certificates, filterable by `cert`.
  - `PATCH /certificates/:id/dates` — Validates and permanently locks `startDate`, `endDate`, and derived `issueDate`.
  - `GET /certificates/:identifier` — **Public endpoint** returning verified certificate details by ULID or `KH-XXXX-XXXX` code.

---

## 🛠️ Technology Stack

| Layer | Technologies | Architectural Role |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19, TypeScript, Vite 8, React Router 7** | SPA routing (`PublicRoute` / `ProtectedRoute`), fast HMR, and modular page views. |
| **Styling & UI Primitives** | **Tailwind CSS 3, shadcn/ui, Radix UI, Framer Motion, Lucide Icons** | RTL-first accessible component system, modal/sheet primitives, and layout transitions. |
| **Data & Forms** | **TanStack Query v5, React Hook Form, Zod** | Client state synchronization, API service abstractions, and schema validation. |
| **Document Export** | **html-to-image, jsPDF** | High-DPI DOM-to-PNG capture (`pixelRatio: 5`) and client-side A4 landscape PDF generation. |
| **Backend Framework** | **NestJS 11, Express 5, TypeScript** | Modular controllers, injectable domain services, guards, and Swagger/OpenAPI generation. |
| **Database & ORM** | **PostgreSQL, Prisma ORM 7 (`@prisma/adapter-pg`), ULID** | Relational persistence, transactional integrity, and lexicographically sortable ULID keys. |
| **Authentication** | **@nestjs/jwt, Bcrypt, HTTP-Only Cookies** | Stateless JWT session management with automatic `401` client session invalidation. |
| **Testing** | **Vitest, React Testing Library, Jest, Supertest** | Unit and integration testing across frontend and backend packages. |

---

## 📂 Monorepo Structure

```text
certificates-repo/
├── certificates/                  # Frontend React 19 SPA (Vite 8 + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui Radix primitives
│   │   │   ├── CustomDatePicker.tsx # RTL calendar & SOCPA date-locking modal
│   │   │   ├── DashboardLayout.tsx  # Authenticated shell & sidebar navigation
│   │   │   └── NavLink.tsx
│   │   ├── hooks/                 # useAuth (session context & 401 interceptor), useToast
│   │   ├── pages/                 # Landing, Login, Register, Tests, TestTaking,
│   │   │                          # Payment, Certificates, CertificateView, Profile
│   │   └── services/              # API client modules (auth, test-variants, payments, certificates)
│   └── vite.config.ts
│
├── certificates-backend/          # Backend REST API (NestJS 11 + Prisma 7)
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL schema & enums (CertType, TierName)
│   │   ├── seed.ts                # Database seeder
│   │   └── seeding/               # JSON question banks per certification track (cia, cma, cpa, cfe, cisa)
│   └── src/
│       ├── auth/                  # JWT auth controller, service, guard, and Swagger docs
│       ├── bundles/               # ActiveBundle lifecycle & progress tracking
│       ├── certificates/          # Certificate issuance, public lookup, & immutable date locking
│       ├── individual-tests/      # ActiveIndividualTest lock lifecycle
│       ├── payments/              # Fulfillment service & atomic certificate generation
│       ├── prisma/                # PrismaService & database connection management
│       ├── test-variants/         # Paginated test catalog & variant question delivery
│       ├── utils.ts               # ULID-to-certificate-number derivation helper
│       └── main.ts                # NestJS bootstrap, CORS, cookie parser, & Swagger setup
│
├── shared/                        # Shared TypeScript Library (@shared/*)
│   ├── dtos-and-types/            # Shared DTOs (auth, bundle, certificate, payment, test-variants)
│   ├── pricing.ts                 # Tier metrics (hours, duration, questionCount) & bundle helpers
│   └── index.ts
│
├── dev.mjs                        # Unified multi-process development runner
└── package.json                   # Root workspace scripts & dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **pnpm** (v9+)
- **PostgreSQL** (v15+ locally or via Docker)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `certificates-backend/.env`:

```env
DATABASE_URL="postgresql://dev:dev@localhost:5433/devuser?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=3000
```

*(Optional)* If running PostgreSQL via Docker:

```bash
docker run -d --name certificates \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=devuser \
  -p 5433:5432 \
  postgres:15-alpine
```

### 3. Run Database Migrations & Seed Data

```bash
cd certificates-backend
npx prisma migrate dev
pnpm db:seed
```

### 4. Start Development Servers

From the repository root, start both the backend and frontend together:

```bash
pnpm dev
```

Or run each service individually:

```bash
# Backend API (http://localhost:3000 | Swagger UI: http://localhost:3000/api)
pnpm dev:backend

# Frontend SPA (http://localhost:5173)
pnpm dev:frontend
```

### 5. Build & Test Commands

```bash
# Build frontend and backend for production
pnpm build:frontend
pnpm build:backend

# Run test suites
pnpm test:frontend
pnpm test:backend
```
