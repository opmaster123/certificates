# Khutta CPE Pro (خطى)

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS 11](https://img.shields.io/badge/NestJS_11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Empowering finance and audit professionals to earn verifiable Continuing Professional Education (CPE) credits through fast, interactive assessments — replacing passive video courses.**

</div>

---

## 📌 Project Overview

Maintaining professional certifications like **CPA / SOCPA, CIA, CMA, CISA, and CFE** requires earning dozens of Continuing Professional Education (CPE) hours every year. Traditionally, professionals were forced to sit through tens of hours of passive, recorded video lectures that waste time and offer little proof of actual competency.

**Khutta CPE Pro** solves this problem with an interactive, competency-based assessment platform. Instead of passive watching, professionals prove their mastery through focused assessments, immediately earn certified CPE hours, customize training and issuance timelines to align with regulatory windows (such as SOCPA), and export verifiable, tamper-evident digital certificates with live QR verification.

---

## ✨ Key Features

- **⚡ Competency-Based Assessments:**
  - Rapid, multi-tier timed assessments (Small: 2 hrs / 10 mins, Medium: 4 hrs / 20 mins, Large: 6 hrs / 30 mins) with instant grading, detailed rationale explanations, and unlimited free retakes.
- **📜 Instant Certificate Issuance:**
  - Automated credential generation upon passing (70%+ threshold) with automatic CPE hour accumulation in the user's dashboard.
- **📅 Smart Date Alignment & Anti-Tamper Lock:**
  - Full control over training start and end dates within accredited hour windows, automatic issuance date derivation (`endDate + 2 days`), and an irreversible lock mechanism ensuring 100% regulatory compliance with SOCPA and internal audit bodies.
- **🔍 Public Digital Verification & QR Active Trail:**
  - Each certificate generates a unique public verification ID and scannable QR code leading to a publicly accessible verification page.
- **📦 Custom Multi-Track Bundle Builder:**
  - Flexible multi-course bundle configuration across different certification tracks with tiered dynamic discounts (up to 20%).
- **🎨 Pixel-Perfect Certificate Rendering & PDF Export:**
  - Bilingual, elegant certificate templates with high-resolution export ready for official submission and LinkedIn sharing.
- **🌐 Bilingual & GCC-Tailored UX:**
  - RTL-native, modern dark-themed user interface designed specifically for accounting and auditing professionals across the Gulf and Arab region.

---

## 🔄 User Flows (Step-by-Step)

### 1. Discovery & Account Onboarding

- **Landing & Exploration:** The user explores available certification tracks (**CIA, CPA/SOCPA, CMA, CISA, CFE**), tests the interactive savings calculator, takes a 3-question sandbox quiz, or customizes bundle packages.
- **Authentication:** The user registers or logs in. The backend issues a secure JWT stored in HTTP-only cookies, granting access to protected exam and credential services.

### 2. Individual Assessment & Instant Certification

- **Exam Selection:** The user selects a single test variant from the catalog (**Small: 2 hrs**, **Medium: 4 hrs**, or **Large: 6 hrs**).
- **Timed Testing:** The user completes the exam within the allotted time (1 minute per question).
- **Evaluation & Issuance:**
  - If the user scores below 70%, they receive immediate answer rationales and can retake the assessment immediately for free.
  - Upon scoring 70% or higher, the backend immediately generates the official `UserCertificate` record and credits the accredited CPE hours to the user's dashboard.

### 3. Multi-Track Custom Bundle Workflow

- **Custom Bundle Building:** The user adds multiple exams from diverse certification tracks into the sliding Cart Drawer.
- **Dynamic Tiered Discounts:** The pricing engine automatically calculates real-time bundle discounts (up to 30% off).
- **Active Bundle Locking:** Confirming the bundle establishes an active bundle state in the database, allowing the user to solve exams at their own pace.
- **Atomic Credentialing:** Once all exams in the bundle are passed, the backend issues all certificates in a single atomic transaction and clears the active bundle lock.

### 4. Regulatory Date Customization & Anti-Tamper Locking

- **Configuring Training Dates:** For any earned certificate, the user selects a Training Start Date (`startDate`) and Training End Date (`endDate`).
- **Validation & Derivation:** The system verifies that the training duration is between 1 day and the certificate's maximum accredited credit hours, and auto-derives the Issue Date as `endDate + 2 days` (capped at today's date).
- **Permanent Lock:** Confirming the dates commits them to the database with permanent immutability, preventing retrospective tampering and ensuring compliance with licensing bodies like **SOCPA**.

### 5. Public Verification & Certificate Export

- **High-Resolution Export:** The user downloads high-resolution PDF or image certificates rendered from the bilingual certificate template.
- **Public Verification:** Employers or regulatory auditors can scan the certificate's live QR code or navigate directly to `/certificate/:code` to inspect the verified credential, audit trail, and training details without logging in.

---

## ⚖️ Implemented Business Rules

| Rule Category               | Description                                                                                                                       | Implementation Details                                                     |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Assessment Tiers**        | Small (10 Qs / 10 mins / **2.0 CPE hrs**), Medium (20 Qs / 20 mins / **4.0 CPE hrs**), Large (30 Qs / 30 mins / **6.0 CPE hrs**). | 1 min/Q; 1 CPE hr per 5 Qs; 70% passing threshold; unlimited free retakes. |
| **Active Locks**            | A user cannot create a new bundle while an active bundle or active individual test lock exists.                                   | Enforced in backend service layers and database uniqueness constraints.    |
| **Dynamic Pricing**         | Base rate $3.00/hr. Bundles < 10 hrs = 0% discount, 10–19.9 hrs = 20% discount, >= 20 hrs = 30% discount.                         | Shared pricing engine (`shared/pricing.ts`).                               |
| **Date Validation**         | `1 <= (endDate - startDate) <= variant.hours`; `issueDate = endDate + 2 days`; `issueDate <= today`.                              | Validated on both client and server with permanent immutability upon lock. |
| **Certificate Identifiers** | Deterministic 10-character public short codes (`KH` + last 8 characters of record's ULID).                                        | Case-insensitive and hyphen-tolerant public search.                        |

---

## 🛠️ Tech Stack & Architecture

This repository is built as a unified, type-safe full-stack TypeScript monorepo:

| Layer                     | Technologies                                           | Why It Was Chosen                                                                                                   |
| :------------------------ | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Frontend**              | **React 19, Vite, Tailwind CSS, Framer Motion**        | Ultra-fast rendering, sleek animations, responsive layout, and modern component architecture.                       |
| **UI System**             | **shadcn/ui, Radix UI Primitives, Lucide Icons**       | Accessible, headless UI primitives tailored with custom typography and dark radiant themes.                         |
| **State & Data Fetching** | **TanStack Query (React Query), React Hook Form, Zod** | Robust client caching, optimistic updates, and schema-driven form validation.                                       |
| **Backend**               | **NestJS 11, Express**                                 | Modular, enterprise-grade architecture with dependency injection, middleware, and clear separation of concerns.     |
| **Database & ORM**        | **PostgreSQL, Prisma ORM**                             | Relational data integrity, type-safe database queries, seamless migrations, and automated seeding.                  |
| **Auth & Security**       | **JWT, HTTP-only Cookies, Bcrypt**                     | Secure stateless authentication, password hashing, and role-safe protected API routes.                              |
| **Shared Core**           | **Shared TypeScript DTOs & Pricing Library**           | Single source of truth for types, DTO contracts, validation logic, and pricing algorithms across client and server. |
| **API Documentation**     | **Swagger / OpenAPI**                                  | Interactive API documentation with custom Swagger decorators and request/response schemas.                          |

---

## 📂 Monorepo Structure

```
certificates-repo/
├── certificates/           # Frontend React 19 SPA (Vite + Tailwind CSS + shadcn/ui)
│   ├── src/
│   │   ├── components/     # UI Primitives & CertificateTemplate.tsx
│   │   ├── hooks/          # useAuth, useToast, etc.
│   │   ├── pages/          # Landing, Dashboard, Tests, TestTaking, Certificates, etc.
│   │   └── services/       # API client abstractions (auth, certificates, test-variants)
│   └── vite.config.ts
│
├── certificates-backend/   # Backend REST API (NestJS 11 + Prisma ORM + PostgreSQL)
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL database schema & relations
│   │   └── seed.ts         # Comprehensive database seed data (tests & questions)
│   └── src/
│       ├── auth/           # JWT authentication, guards, and controllers
│       ├── bundles/        # Multi-test active bundles & progress tracking
│       ├── certificates/   # Certificate issuance, search, & date locking
│       ├── individual-tests/# Standalone test completion & lock management
│       ├── test-variants/  # Paginated test catalog & question delivery
│       └── main.ts         # Server bootstrap, CORS, and Swagger configuration
│
├── shared/                 # Shared TypeScript Library
│   ├── dtos-and-types/     # Shared DTOs and interfaces used across client & server
│   ├── pricing.ts          # Tier definitions, pricing algorithms, & discount logic
│   └── index.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v9 or higher)
- **PostgreSQL** instance running locally or via Docker

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/opmaster123/certificates.git
cd certificates
pnpm install
```

### 2. Environment Configuration

Create an `.env` file in `certificates-backend` with your database and JWT configurations:

```env
DATABASE_URL="postgresql://dev:dev@localhost:5433/devuser?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=3000
```

### 3. Database Setup & Seeding

Run Prisma migrations and seed the comprehensive test database:

```bash
cd certificates-backend
npx prisma migrate dev
pnpm db:seed
```

### 4. Running the Development Servers

Run both backend and frontend concurrently:

```bash
# Start backend (NestJS on port 3000)
pnpm dev:backend

# Start frontend (Vite on port 5173)
pnpm dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application. API Swagger docs are available at [http://localhost:3000/api](http://localhost:3000/api).
