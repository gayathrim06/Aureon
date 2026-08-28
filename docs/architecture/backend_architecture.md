# Aureon Backend Architecture Overview

## Architecture Design & Tech Stack
- **Framework**: Python Flask RESTful Blueprint API
- **ORM & Database**: SQLAlchemy binding to PostgreSQL primary (`localhost:5432/aureon_db`) with fallback SQLite (`aureon_local.db`).
- **Security & RBAC**: JWT Bearer Authentication (`Flask-JWT-Extended`), PBKDF2 SHA-256 Password Hashing, 4-tier Role-Based Access Control (`ADMIN`, `TEAM_LEAD`, `DEVELOPER`, `QA_AUDITOR`).
- **Static Analysis Engine**: Pylint & Radon metrics integration for Maintainability Index and Cyclomatic Complexity.

## Blueprint Route Map
1. `/api/v1/auth`: Authentication, login lookup, registration, security questions, password recovery.
2. `/api/v1/users`: User management, search, filtering, role assignment, bulk multi-select deletion.
3. `/api/v1/teams`: Team creation, team lead allocation, member assignments.
4. `/api/v1/projects`: Project management, hierarchy scoping, health indicators.
5. `/api/v1/tasks`: Kanban task tracking, status transitions (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).
6. `/api/v1/sprints`: Sprint iteration tracking and goal metrics.
7. `/api/v1/dashboards`: Scoped metrics for Admin, Team Lead, Developer, and Auditor dashboards.
8. `/api/v1/code-analysis`: Static code quality analysis and vulnerability metrics.
9. `/api/v1/audits`: Audit logging and security activity records.
10. `/api/v1/notifications`: Real-time notification updates.
