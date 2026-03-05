# SinSalarial Intelligence MVP

Premium B2B SaaS Platform for Compensation Intelligence and Total Rewards.

## 🚀 Overview
SinSalarial helps HR and CFOs make data-driven compensation decisions by comparing internal payroll data with market benchmarks (P25, P50, P75) and simulating merit cycles.

### Key Features
- **Multi-tenant SaaS**: Secure tenant segregation.
- **Payroll Snapshot**: Bulk upload (CSV/XLSX) with intelligent validation.
- **Job Match**: Algorithm-driven mapping between internal titles and market standards.
- **Compensation Diagnostic**: Visual dashboards showing market positioning per area and individual.
- **Merit Simulator**: 3 scenarios (Conservative, Balanced, Agressive) to optimize budget distribution.

---

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Framer Motion, Lucide, Recharts.
- **Backend**: NestJS, Prisma ORM, BullMQ (Redis) for async jobs.
- **Auth**: AWS Cognito (RBAC support).
- **Storage**: AWS S3 (Snapshots & Exports).
- **Database**: PostgreSQL (AWS RDS).

---

## 🏃 Local Execution

### 1. Infrastructure
Ensure you have Docker and Docker Compose installed:
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed # Set up demo tenant and benchmark data
npm run start:dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure
- `/backend`: NestJS source code and Prisma schema.
- `/frontend`: Next.js application and styles.
- `/ASSUMPTIONS.md`: Functional and technical assumptions.
- `/docker-compose.yml`: Local infrastructure (Postgres, Redis).

---

## 📋 MVP Status
- [x] Multi-tenant Data Model
- [x] S3 Storage Integration
- [x] Async Payroll Processing Queue
- [x] Job Match Algorithm
- [x] Market Benchmark Provider
- [x] 3-Scenario Merit Simulation
- [x] Premium Dashboard UI
- [x] Demo Seeding

**Next Steps (Phase 2):**
- [ ] Direct ERP/HCM API integrations.
- [ ] Advanced AI-driven churn/retention prediction.
- [ ] Performance-to-pay correlation.

---
Built by Antigravity for Tobias Estivalete.
