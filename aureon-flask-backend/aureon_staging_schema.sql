-- ============================================================================
-- AUREON APPLICATION DATABASE SCHEMA (OFFLINE GENERATED FOR STAGING)
-- Target Dialect: PostgreSQL 13+ (Neon Serverless PostgreSQL)
-- Source: Declarative SQLAlchemy models in aureon-flask-backend/models.py
-- Total Tables: 27 Active Application Tables
-- Generated: Offline from SQLAlchemy metadata (zero database connections)
-- ============================================================================

-- Enable standard UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Table: tbl_audit_log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_audit_log (
	id UUID NOT NULL, 
	action VARCHAR(100) NOT NULL, 
	timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	browser VARCHAR(100) NOT NULL, 
	operating_system VARCHAR(100) NOT NULL, 
	details TEXT, 
	user_email VARCHAR(120), 
	role_name VARCHAR(50), 
	PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_role
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_role (
	id UUID NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	level INTEGER, 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (code)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_user
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_user (
	id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	username VARCHAR(150), 
	password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255), 
	phone VARCHAR(30), 
	employee_id VARCHAR(50), 
	department VARCHAR(100), 
	designation VARCHAR(100), 
	gender VARCHAR(20), 
	must_change_password BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_staff BOOLEAN NOT NULL, 
	is_superuser BOOLEAN NOT NULL, 
	date_joined TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	failed_login_attempts INTEGER NOT NULL, 
	account_status VARCHAR(20) NOT NULL, 
	email_verified BOOLEAN NOT NULL, 
	first_login BOOLEAN NOT NULL, 
	date_of_birth DATE, 
	pet_name VARCHAR(150), 
	school_friend_name VARCHAR(150), 
	skills TEXT, 
	max_concurrent_tasks INTEGER, 
	capacity_hours FLOAT, 
	role_id UUID, 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	UNIQUE (username), 
	UNIQUE (employee_id), 
	FOREIGN KEY(role_id) REFERENCES tbl_role (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_notification
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_notification (
	id UUID NOT NULL, 
	recipient_id UUID, 
	title VARCHAR(150) NOT NULL, 
	message TEXT, 
	notification_type VARCHAR(50), 
	read BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(recipient_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_project
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_project (
	id UUID NOT NULL, 
	name VARCHAR(100), 
	description TEXT, 
	status VARCHAR(30), 
	priority VARCHAR(30), 
	start_date DATE, 
	target_deadline DATE, 
	manager_id UUID, 
	lead_id UUID, 
	health_score INTEGER, 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(manager_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(lead_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_bug
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_bug (
	id UUID NOT NULL, 
	bug_id VARCHAR(50), 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	steps_to_reproduce TEXT, 
	severity VARCHAR(30), 
	priority VARCHAR(30), 
	status VARCHAR(30), 
	evidence_file VARCHAR(255), 
	resolution_summary TEXT, 
	project_id UUID, 
	reporter_id UUID, 
	assigned_developer_id UUID, 
	assigned_qa_id UUID, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id), 
	FOREIGN KEY(reporter_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(assigned_developer_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(assigned_qa_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_github_repository
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_github_repository (
	id UUID NOT NULL, 
	project_id UUID, 
	github_repository_id BIGINT, 
	owner VARCHAR(150) NOT NULL, 
	repository_name VARCHAR(150) NOT NULL, 
	repository_url VARCHAR(255) NOT NULL, 
	default_branch VARCHAR(100), 
	description TEXT, 
	visibility VARCHAR(50), 
	language VARCHAR(100), 
	stars INTEGER, 
	forks INTEGER, 
	open_issues INTEGER, 
	last_synced_at TIMESTAMP WITHOUT TIME ZONE, 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_project_health_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_project_health_history (
	id UUID NOT NULL, 
	project_id UUID NOT NULL, 
	overall_score INTEGER, 
	health_status VARCHAR(30), 
	sprint_task_score FLOAT, 
	github_score FLOAT, 
	code_quality_score FLOAT, 
	engineering_risk_score FLOAT, 
	metrics_breakdown TEXT, 
	calculated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

CREATE INDEX IF NOT EXISTS ix_tbl_project_health_history_calculated_at ON tbl_project_health_history (calculated_at);
CREATE INDEX IF NOT EXISTS ix_tbl_project_health_history_project_id ON tbl_project_health_history (project_id);

-- ----------------------------------------------------------------------------
-- Table: tbl_project_member
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_project_member (
	id UUID NOT NULL, 
	project_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	role_in_project VARCHAR(100) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id), 
	FOREIGN KEY(user_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_report
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_report (
	id UUID NOT NULL, 
	project_id UUID, 
	report_type VARCHAR(50), 
	title VARCHAR(150), 
	content_json TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_repository
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_repository (
	id UUID NOT NULL, 
	project_id UUID, 
	repository_name VARCHAR(100), 
	name VARCHAR(100), 
	repository_url VARCHAR(255), 
	url VARCHAR(255), 
	provider VARCHAR(50), 
	default_branch VARCHAR(50), 
	status VARCHAR(30), 
	connection_status VARCHAR(30), 
	last_synced TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_risk
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_risk (
	id UUID NOT NULL, 
	project_id UUID, 
	title VARCHAR(150), 
	description TEXT, 
	severity VARCHAR(30), 
	status VARCHAR(30), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_team (
	id UUID NOT NULL, 
	name VARCHAR(100), 
	team_code VARCHAR(50), 
	description TEXT, 
	availability_status VARCHAR(30), 
	status VARCHAR(30), 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	project_id UUID, 
	team_leader_id UUID, 
	lead_id UUID, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id), 
	FOREIGN KEY(team_leader_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(lead_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: code_analysis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS code_analysis (
	id UUID NOT NULL, 
	repository_id UUID, 
	commit_hash VARCHAR(100), 
	tool_name VARCHAR(50), 
	status VARCHAR(30), 
	quality_score FLOAT, 
	executed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_repository (id)
);

-- ----------------------------------------------------------------------------
-- Table: code_quality_reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS code_quality_reports (
	id UUID NOT NULL, 
	repository_id UUID, 
	project_id UUID, 
	analysis_date TIMESTAMP WITHOUT TIME ZONE, 
	total_files INTEGER, 
	total_lines INTEGER, 
	complexity_score FLOAT, 
	maintainability_score FLOAT, 
	pylint_errors INTEGER, 
	pylint_warnings INTEGER, 
	quality_score FLOAT, 
	risk_level VARCHAR(30), 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_repository (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_github_commit
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_github_commit (
	id UUID NOT NULL, 
	repository_id UUID NOT NULL, 
	github_commit_id VARCHAR(100), 
	commit_sha VARCHAR(100) NOT NULL, 
	author_name VARCHAR(150), 
	author_email VARCHAR(255), 
	branch VARCHAR(100), 
	commit_message TEXT, 
	commit_date TIMESTAMP WITHOUT TIME ZONE, 
	commit_url VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_github_repository (id)
);

CREATE INDEX IF NOT EXISTS ix_tbl_github_commit_commit_sha ON tbl_github_commit (commit_sha);

-- ----------------------------------------------------------------------------
-- Table: tbl_github_contributor
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_github_contributor (
	id UUID NOT NULL, 
	repository_id UUID NOT NULL, 
	github_user_id VARCHAR(50), 
	username VARCHAR(150) NOT NULL, 
	display_name VARCHAR(150), 
	contributions INTEGER, 
	profile_url VARCHAR(255), 
	avatar_url VARCHAR(255), 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_github_repository (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_github_pull_request
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_github_pull_request (
	id UUID NOT NULL, 
	repository_id UUID NOT NULL, 
	github_pr_id BIGINT, 
	pr_number INTEGER NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	author VARCHAR(150), 
	state VARCHAR(50), 
	source_branch VARCHAR(100), 
	target_branch VARCHAR(100), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	merged_at TIMESTAMP WITHOUT TIME ZONE, 
	closed_at TIMESTAMP WITHOUT TIME ZONE, 
	review_status VARCHAR(50), 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_github_repository (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_sprint
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_sprint (
	id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	goal TEXT, 
	status VARCHAR(30), 
	start_date DATE, 
	end_date DATE, 
	project_id UUID, 
	team_id UUID, 
	created_by_id UUID, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	completion_date DATE, 
	completion_notes TEXT, 
	carry_forward_tasks_count INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id), 
	FOREIGN KEY(team_id) REFERENCES tbl_team (id), 
	FOREIGN KEY(created_by_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_team_member
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_team_member (
	id UUID NOT NULL, 
	team_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(team_id) REFERENCES tbl_team (id), 
	FOREIGN KEY(user_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: code_analysis_issues
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS code_analysis_issues (
	id UUID NOT NULL, 
	analysis_id UUID, 
	file_path VARCHAR(255), 
	line_number INTEGER, 
	issue_type VARCHAR(50), 
	category VARCHAR(50), 
	message_id VARCHAR(50), 
	description TEXT, 
	severity VARCHAR(30), 
	PRIMARY KEY (id), 
	FOREIGN KEY(analysis_id) REFERENCES code_analysis (id)
);

-- ----------------------------------------------------------------------------
-- Table: code_metrics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS code_metrics (
	id UUID NOT NULL, 
	analysis_id UUID, 
	file_path VARCHAR(255), 
	cyclomatic_complexity FLOAT, 
	complexity_rank VARCHAR(10), 
	loc INTEGER, 
	logical_loc INTEGER, 
	comment_loc INTEGER, 
	maintainability_index FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(analysis_id) REFERENCES code_analysis (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_task
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_task (
	id UUID NOT NULL, 
	title VARCHAR(150), 
	description TEXT, 
	ticket_type VARCHAR(50), 
	parent_task_id UUID, 
	priority VARCHAR(30), 
	status VARCHAR(30), 
	start_date DATE, 
	due_date DATE, 
	original_due_date DATE, 
	due_date_changed_at TIMESTAMP WITHOUT TIME ZONE, 
	due_date_changed_by_id UUID, 
	due_date_change_reason TEXT, 
	estimated_hours FLOAT, 
	actual_hours FLOAT, 
	progress INTEGER, 
	assigned_to_id UUID, 
	assigned_by_id UUID, 
	created_by_id UUID, 
	project_id UUID, 
	team_id UUID, 
	sprint_id UUID, 
	delay_reason VARCHAR(100), 
	delay_remark TEXT, 
	delay_remark_added_at TIMESTAMP WITHOUT TIME ZONE, 
	delay_remark_by_id UUID, 
	team_leader_review TEXT, 
	team_leader_reviewed_at TIMESTAMP WITHOUT TIME ZONE, 
	team_leader_reviewed_by_id UUID, 
	escalation_level INTEGER, 
	escalation_reason TEXT, 
	escalated_at TIMESTAMP WITHOUT TIME ZONE, 
	overdue_notified_lead BOOLEAN, 
	overdue_notified_pm BOOLEAN, 
	required_skills TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_task_id) REFERENCES tbl_task (id), 
	FOREIGN KEY(due_date_changed_by_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(assigned_to_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(assigned_by_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(created_by_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(project_id) REFERENCES tbl_project (id), 
	FOREIGN KEY(team_id) REFERENCES tbl_team (id), 
	FOREIGN KEY(sprint_id) REFERENCES tbl_sprint (id), 
	FOREIGN KEY(delay_remark_by_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(team_leader_reviewed_by_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_commit
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_commit (
	id UUID NOT NULL, 
	repository_id UUID, 
	task_id UUID, 
	user_id UUID, 
	commit_hash VARCHAR(100), 
	author_name VARCHAR(100), 
	commit_message TEXT, 
	commit_date TIMESTAMP WITHOUT TIME ZONE, 
	timestamp TIMESTAMP WITHOUT TIME ZONE, 
	files_changed INTEGER, 
	additions INTEGER, 
	deletions INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(repository_id) REFERENCES tbl_repository (id), 
	FOREIGN KEY(task_id) REFERENCES tbl_task (id), 
	FOREIGN KEY(user_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_task_attachment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_task_attachment (
	id UUID NOT NULL, 
	file VARCHAR(255), 
	filename VARCHAR(255) NOT NULL, 
	task_id UUID NOT NULL, 
	created_by_id UUID, 
	updated_by_id UUID, 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tbl_task (id), 
	FOREIGN KEY(created_by_id) REFERENCES tbl_user (id), 
	FOREIGN KEY(updated_by_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_task_comment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_task_comment (
	id UUID NOT NULL, 
	task_id UUID NOT NULL, 
	user_id UUID, 
	comment TEXT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tbl_task (id), 
	FOREIGN KEY(user_id) REFERENCES tbl_user (id)
);

-- ----------------------------------------------------------------------------
-- Table: tbl_task_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_task_history (
	id UUID NOT NULL, 
	task_id UUID NOT NULL, 
	user_id UUID, 
	actor_id UUID, 
	created_by_id UUID, 
	updated_by_id UUID, 
	action VARCHAR(100), 
	action_type VARCHAR(50), 
	old_value VARCHAR(255), 
	new_value VARCHAR(255), 
	details TEXT, 
	is_active BOOLEAN, 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tbl_task (id), 
	FOREIGN KEY(user_id) REFERENCES tbl_user (id)
);
