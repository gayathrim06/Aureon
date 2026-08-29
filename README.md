# 🚀 Aureon – Software Engineering Intelligence Platform

> **AI-Powered Software Engineering Intelligence Platform for Project Health, Code Quality, Developer Growth, and Executive Metrics.**

---

## 🌟 Key Features

### 🔐 1. Enterprise Authentication & Multi-Role RBAC
- **Multi-Role Authorization**: Strict role-based access control for `ADMIN`, `TEAM_LEAD`, `DEVELOPER`, and `QA_AUDITOR`.
- **Flexible Login Lookup**: Supports authentication via either Email address or Username.
- **Security & Password Recovery**: PBKDF2 SHA-256 password hashing, JWT Bearer Token validation, security question verification, and forced initial password updates for provisioned accounts.
- **3-Way Personalization**: User theme switcher featuring Dark Mode, Light Mode, and Warm Sepia.

### 👥 2. User & Team Management
- **User Directory**: Full search, multi-field filtering, role assignments, and profile management.
- **Bulk Operations**: Multi-select user deletion with transactional database integrity.
- **Team Allocation**: Hierarchical team structures, Team Lead assignments, and developer resource allocations.

### 📋 3. Project, Task & Sprint Tracking
- **Transactional Project Creation**: Health metrics calculation, manager/lead assignments, and priority controls.
- **Kanban Task Board**: Interactive, persistent task movement across columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).
- **Sprint Management**: Iteration goal mapping, timeline tracking, and progress metrics.

### 📊 4. Static Code Quality & Repository Analysis
- **Code Metrics Engine**: Simulated Pylint score calculations, Radon cyclomatic complexity metrics, and maintainability index reporting.
- **Project Health Monitoring**: Real-time risk indicator engine tracking project complexity and stability.

### 📜 5. Dashboards, Audit Trail & Notifications
- **Role-Scoped Dashboards**: Tailored executive and developer metrics for Admin, Team Lead, Developer, and Auditor roles.
- **Audit Logging**: Comprehensive transactional log tracking user logins, administrative changes, and security events.
- **Real-Time Notifications**: System notifications for task assignments and project milestones.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Python 3.14, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS |
| **Databases** | PostgreSQL (Primary `localhost:5432/aureon_db`), SQLite (`aureon_local.db` Fallback) |
| **Code Analysis** | Pylint, Radon Metrics Engine |
| **Testing** | Pytest 9.1 Test Automation Suite |
| **Legacy Architecture** | Django 4.2 REST Framework |

---

## 📁 Repository Structure

```
MCA project main and mini/
├── aureon-app/                      # React 18 Frontend Application (Vite + Tailwind)
│   ├── src/
│   │   ├── components/              # Shared UI components
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── pages/                   # Application views (Dashboard, Projects, Teams, Tasks, etc.)
│   │   ├── roles/                   # Role-specific dashboard layouts
│   │   └── services/                # API Client, Audit Logger, RBAC Service
│   └── package.json
├── aureon-flask-backend/            # Core Flask REST API Backend
│   ├── routes/                      # Blueprint endpoints (auth, users, projects, teams, tasks, etc.)
│   ├── services/                    # Static analysis, health monitoring, risk engine, RBAC
│   ├── tests/                       # Pytest automation suite (15 test modules)
│   ├── app.py                       # Application factory & CORS initialization
│   ├── config.py                    # Database & environment configurations
│   ├── models.py                    # SQLAlchemy database models
│   └── seed.py                      # Database populator & initial admin user setup
├── aureon-backend/                  # Legacy Django REST Framework Backend
├── docs/                            # Technical Documentation
│   ├── api/                         # OpenAPI 3.0 API specifications (swagger)
│   └── architecture/                # Backend Architecture & Database Schema docs
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL (Optional; local SQLite fallback is enabled automatically if PostgreSQL is offline)

---

### 1. Backend Setup (Flask REST API)

```bash
# Navigate to the Flask backend directory
cd aureon-flask-backend

# Install Python dependencies
pip install -r requirements.txt

# Seed the initial database (creates default roles & Admin account)
python seed.py

# Run the Flask development server (runs on http://localhost:5000)
python app.py
```

> **Default Admin Credentials**:
> - **Email**: `admin@aureon.com`
> - **Password**: `Aureon@123`

---

### 2. Frontend Setup (React App)

```bash
# Navigate to the React app directory
cd aureon-app

# Install Node modules
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## 🧪 Running Automated Tests

Aureon includes 15 automated Pytest unit and integration test suites covering Authentication, RBAC, User Management, Project Creation, Team Allocation, Kanban Workflows, and Static Analysis:

```bash
# Run all Pytest suites from the project root
python -m pytest aureon-flask-backend/tests/ -v
```

---

## 📖 API Documentation & Specifications

Detailed technical documentation and API specifications are available in the [`docs/`](file:///docs/) directory:
- **API Specification**: [`docs/api/openapi_spec.yaml`](file:///docs/api/openapi_spec.yaml)
- **Backend Architecture**: [`docs/architecture/backend_architecture.md`](file:///docs/architecture/backend_architecture.md)
- **Database Schema**: [`docs/architecture/database_schema.md`](file:///docs/architecture/database_schema.md)

---

## 👤 Author & Maintainer

**Gayathri** ([@gayathrim06](https://github.com/gayathrim06))  
*Aureon – Software Engineering Intelligence Platform*
