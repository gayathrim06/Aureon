-- ━━━ AUREON POSTGRESQL SEED SCRIPT (20 USERS) ━━━
-- Run this script directly in pgAdmin or DBeaver Query Tool on your aureon_db database

INSERT INTO public.tbl_user (id, email, username, full_name, password, employee_id, department, designation, account_status, is_active, is_staff, is_superuser, date_joined, updated_at, failed_login_attempts, email_verified, first_login, must_change_password)
VALUES
(gen_random_uuid(), 'admin@aureon.com', 'admin', 'GAYATHRI M', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-001', 'Executive Management', 'CTO', 'ACTIVE', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'krish@aureon.com', 'krish', 'Krishna Deepesh', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-002', 'Quality Assurance', 'Tech Lead', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'sainu@aureon.com', 'sainu', 'Sainu Anna Sajan', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-003', 'Engineering', 'Frontend Developer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'jiya@aureon.com', 'jiya', 'Jiya Thomas', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-004', 'Engineering', 'Software Developer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'eli@aureon.com', 'eli', 'Elizabeth Mathew', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP5856', 'Engineering', 'Senior Technical Program Manager', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'rinta@aureon.com', 'rinta', 'Rinta Thomas', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-006', 'Engineering', 'Full Stack Developer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'elena_test_prov@aureon.com', 'elena_test_prov', 'Elena Rostova Provision Test', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP1246', 'Engineering', 'Full Stack Developer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'feba@aureon.com', 'feba', 'Feba Biju', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP6268', 'Executive Office', 'Executive Officer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'bugcheck_user@aureon.com', 'bugcheck_user', 'Test User BugCheck', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP3180', 'Engineering', 'QA Tester', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'sarah.j@aureon.com', 'sarah', 'Sarah Jenkins', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-010', 'Product Management', 'Principal PM', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'david.c@aureon.com', 'david', 'David Chen', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-011', 'Backend Architecture', 'Lead Software Architect', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'ram.kumar@aureon.com', 'ram', 'Ram Kumar', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-012', 'Frontend UI', 'Senior React Engineer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'venu.qa@aureon.com', 'venu', 'Venu QA', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-013', 'Quality Assurance', 'Lead QA Automation Engineer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'alex.r@aureon.com', 'alex', 'Alex Rivera', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-014', 'Infrastructure', 'DevOps & Cloud Architect', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'priya.s@aureon.com', 'priya', 'Priya Sharma', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-015', 'Database & Analytics', 'Data Engineer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'michael.b@aureon.com', 'michael', 'Michael Brown', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-016', 'Security Engineering', 'Cybersecurity Specialist', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'ananya.v@aureon.com', 'ananya', 'Ananya Varma', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-017', 'Quality Assurance', 'Test Automation Specialist', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'vikram.p@aureon.com', 'vikram', 'Vikram Patel', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-018', 'Systems Architecture', 'Principal Backend Engineer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'deepak.n@aureon.com', 'deepak', 'Deepak Nair', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-019', 'Operations & Agile', 'Scrum Master', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false),
(gen_random_uuid(), 'sneha.r@aureon.com', 'sneha', 'Sneha Roy', 'pbkdf2:sha256:600000$saltsalt$hashhash', 'EMP-020', 'Mobile Development', 'Flutter & iOS Engineer', 'ACTIVE', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true, false, false)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  employee_id = EXCLUDED.employee_id,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;
