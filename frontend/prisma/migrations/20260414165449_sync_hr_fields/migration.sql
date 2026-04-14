-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "cnae" TEXT,
    "company_size" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "area_weights" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'HR_USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_date" TIMESTAMP(3) NOT NULL,
    "source_type" TEXT NOT NULL,
    "s3_file_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_import_jobs" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_log" TEXT,

    CONSTRAINT "payroll_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_key" TEXT NOT NULL,
    "full_name" TEXT,
    "area" TEXT NOT NULL,
    "department" TEXT,
    "seniority" TEXT,
    "manager_name" TEXT,
    "gender" TEXT,
    "contract_type" TEXT,
    "monthly_hours" INTEGER,
    "location_city" TEXT,
    "location_state" TEXT,
    "status" TEXT,
    "hired_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "base_salary" DOUBLE PRECISION NOT NULL,
    "benefits_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variable_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtime_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cash" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_catalog" (
    "id" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "title_std" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 0,
    "cbo_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matches" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "job_catalog_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_benchmarks" (
    "id" TEXT NOT NULL,
    "job_catalog_id" TEXT NOT NULL,
    "cnae" TEXT,
    "company_size_bucket" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "p25" DOUBLE PRECISION NOT NULL,
    "p50" DOUBLE PRECISION NOT NULL,
    "p75" DOUBLE PRECISION NOT NULL,
    "n" INTEGER NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "source_tag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "macro_index" (
    "id" TEXT NOT NULL,
    "index_name" TEXT NOT NULL,
    "period_date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "macro_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merit_cycles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget_type" TEXT NOT NULL,
    "budget_value" DOUBLE PRECISION NOT NULL,
    "constraints" TEXT,
    "area_weights" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merit_recommendations" (
    "id" TEXT NOT NULL,
    "merit_cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "suggested_raise_value" DOUBLE PRECISION NOT NULL,
    "suggested_raise_percent" DOUBLE PRECISION NOT NULL,
    "new_total_cash" DOUBLE PRECISION NOT NULL,
    "cost_monthly" DOUBLE PRECISION NOT NULL,
    "cost_annual" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merit_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLT',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_grades" (
    "id" TEXT NOT NULL,
    "structure_id" TEXT NOT NULL,
    "grade_label" TEXT NOT NULL,
    "midpoint" DOUBLE PRECISION NOT NULL,
    "range_spread" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_steps" (
    "id" TEXT NOT NULL,
    "structure_id" TEXT NOT NULL,
    "step_label" TEXT NOT NULL,
    "percent_increment" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_table_entries" (
    "id" TEXT NOT NULL,
    "structure_id" TEXT NOT NULL,
    "grade_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_table_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_diagnostics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_diagnostics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "area_name" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_tenant_id_employee_key_key" ON "employees"("tenant_id", "employee_key");

-- CreateIndex
CREATE UNIQUE INDEX "salary_table_entries_structure_id_grade_id_step_id_key" ON "salary_table_entries"("structure_id", "grade_id", "step_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_snapshots" ADD CONSTRAINT "payroll_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_import_jobs" ADD CONSTRAINT "payroll_import_jobs_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation" ADD CONSTRAINT "compensation_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation" ADD CONSTRAINT "compensation_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_catalog_id_fkey" FOREIGN KEY ("job_catalog_id") REFERENCES "job_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_benchmarks" ADD CONSTRAINT "market_benchmarks_job_catalog_id_fkey" FOREIGN KEY ("job_catalog_id") REFERENCES "job_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merit_cycles" ADD CONSTRAINT "merit_cycles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merit_cycles" ADD CONSTRAINT "merit_cycles_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_merit_cycle_id_fkey" FOREIGN KEY ("merit_cycle_id") REFERENCES "merit_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_grades" ADD CONSTRAINT "salary_grades_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_steps" ADD CONSTRAINT "salary_steps_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_table_entries" ADD CONSTRAINT "salary_table_entries_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_table_entries" ADD CONSTRAINT "salary_table_entries_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "salary_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_table_entries" ADD CONSTRAINT "salary_table_entries_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "salary_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_diagnostics" ADD CONSTRAINT "company_diagnostics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_diagnostics" ADD CONSTRAINT "company_diagnostics_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_diagnostics" ADD CONSTRAINT "area_diagnostics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_diagnostics" ADD CONSTRAINT "area_diagnostics_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "payroll_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
