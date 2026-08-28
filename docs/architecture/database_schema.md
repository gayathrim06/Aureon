# Aureon Database Table Schema & Models Design

## Primary PostgreSQL / SQLite Tables

### 1. `tbl_role`
- `id`: UUID (Primary Key)
- `code`: VARCHAR(50) UNIQUE (`ROLE_ADMIN`, `ROLE_LEAD`, `ROLE_DEV`, `ROLE_QA`)
- `name`: VARCHAR(100)
- `description`: TEXT
- `level`: INTEGER

### 2. `tbl_user`
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) UNIQUE
- `username`: VARCHAR(150)
- `password`: VARCHAR(128) (PBKDF2 SHA-256 Hashed)
- `full_name`: VARCHAR(255)
- `phone`: VARCHAR(30)
- `employee_id`: VARCHAR(50)
- `department`: VARCHAR(100)
- `designation`: VARCHAR(100)
- `gender`: VARCHAR(20)
- `must_change_password`: BOOLEAN
- `account_status`: VARCHAR(20)
- `role_id`: UUID Foreign Key (`tbl_role.id`)

### 3. `tbl_project`
- `id`: UUID (Primary Key)
- `name`: VARCHAR(100)
- `description`: TEXT
- `status`: VARCHAR(30) (`IN_PROGRESS`, `COMPLETED`, `ON_HOLD`)
- `priority`: VARCHAR(30) (`HIGH`, `MEDIUM`, `LOW`)
- `health_score`: INTEGER (Default 90)
- `manager_id`: UUID Foreign Key (`tbl_user.id`)
- `lead_id`: UUID Foreign Key (`tbl_user.id`)

### 4. `tbl_team`
- `id`: UUID (Primary Key)
- `name`: VARCHAR(100)
- `team_code`: VARCHAR(50)
- `project_id`: UUID Foreign Key (`tbl_project.id`)
- `team_leader_id`: UUID Foreign Key (`tbl_user.id`)

### 5. `tbl_task`
- `id`: UUID (Primary Key)
- `title`: VARCHAR(150)
- `description`: TEXT
- `priority`: VARCHAR(30)
- `status`: VARCHAR(30) (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`)
- `assigned_to_id`: UUID Foreign Key (`tbl_user.id`)
- `project_id`: UUID Foreign Key (`tbl_project.id`)
- `sprint_id`: UUID Foreign Key (`tbl_sprint.id`)

### 6. `tbl_audit_log`
- `id`: UUID (Primary Key)
- `action`: VARCHAR(100)
- `timestamp`: DATETIME
- `user_email`: VARCHAR(120)
- `role_name`: VARCHAR(50)
- `status`: VARCHAR(50)
- `details`: TEXT
