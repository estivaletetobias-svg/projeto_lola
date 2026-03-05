# Project Assumptions - SinSalarial Intelligence MVP

## Architecture & Infrastructure
- **Multi-tenancy**: Implemented at the database level with a `tenant_id` on all sensitive tables. Every backend query includes a tenant filtering guard.
- **Benchmark Data**: The market benchmark provider can be configured via environment variables. For the MVP, a Postgres (RDS) adapter is used with dummy/seeded data.
- **Asynchronous Processing**: Bulk uploads and complex merit cycle simulations are handled as background jobs using BullMQ/Redis.
- **Authentication**: AWS Cognito is the primary choice. For local development, a mock authentication strategy will be used if AWS credentials are not provided.
- **Security**: PII is masked in application logs. Financial data is not logged in plaintext.

## Functional Scope
- **Job Matching**: A hybrid algorithm (regex + fuzzy search + CBO codes) provides suggestions with a confidence score. High-confidence matches can be auto-approved in the future, but currently, they require review.
- **Merit Simulation**: Budget allocation follows three distinct deterministic strategies (Conservative, Balanced, Agressive) as specified in the requirements.
- **Exporting**: Excel and CSV files are generated using `exceljs` and uploaded to S3.

## Third-party Services
- **AWS S3**: Used for storing raw payroll files and exported reports.
- **AWS RDS (Postgres)**: Primary persistent storage.
- **Redis**: Job queue persistence.

## Demo Data
- A default demo tenant will be created to showcase all functionalities:
    - ~30 Employees across 5 areas.
    - Standardized job catalog with ~20 roles.
    - Market benchmark data matching those catalog roles.
