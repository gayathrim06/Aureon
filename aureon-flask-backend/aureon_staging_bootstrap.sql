-- ============================================================================
-- AUREON STAGING INITIAL SECURE BOOTSTRAP (ROLES & INITIAL ADMIN)
-- Run this in Neon SQL Editor AFTER running aureon_staging_schema.sql
-- ============================================================================

-- 1. Insert 5 Standard RBAC Roles
INSERT INTO tbl_role (id, code, name, description, level, is_active, is_deleted)
VALUES 
    (gen_random_uuid(), 'ROLE_ADMIN', 'System Admin', 'System Role: System Admin', 1, true, false),
    (gen_random_uuid(), 'ROLE_PM', 'Project Manager', 'System Role: Project Manager', 2, true, false),
    (gen_random_uuid(), 'ROLE_LEAD', 'Team Lead', 'System Role: Team Lead', 3, true, false),
    (gen_random_uuid(), 'ROLE_DEV', 'Developer', 'System Role: Developer', 4, true, false),
    (gen_random_uuid(), 'ROLE_QA', 'QA Auditor', 'System Role: QA Auditor', 5, true, false)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Single Primary Secure Administrator
-- Username: admin
-- Email: admin@aureon.com
-- Initial Temporary Password: AdminInitialPass2026!
-- Note: must_change_password is set to TRUE, forcing immediate password change on first login.
INSERT INTO tbl_user (
    id, email, username, password, full_name, employee_id, department, designation,
    must_change_password, is_active, is_staff, is_superuser,
    date_joined, updated_at, failed_login_attempts, account_status,
    email_verified, first_login, role_id
)
SELECT 
    gen_random_uuid(),
    'admin@aureon.com',
    'admin',
    'pbkdf2:sha256:1000000$hOjUoW307eKX4vWK$391420ec3b5d23c7f9525accd3c5f381158f189cf1d63c2f0c12fc7d440e7dd1',
    'System Administrator',
    'EMP-001',
    'Executive Management',
    'CTO / Administrator',
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0,
    'ACTIVE',
    true,
    true,
    (SELECT id FROM tbl_role WHERE code = 'ROLE_ADMIN')
ON CONFLICT (email) DO NOTHING;
