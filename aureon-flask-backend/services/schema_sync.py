from extensions import db
from sqlalchemy import text

def sync_db_schema():
    """
    Ensures that existing PostgreSQL or SQLite databases have all required columns
    and tables for Sprint, Task, TaskComment, and TaskStatusHistory.
    """
    try:
        db.create_all()
        engine = db.engine
        dialect_name = engine.dialect.name

        with engine.connect() as conn:
            if dialect_name == 'postgresql':
                pg_queries = [
                    # tbl_sprint
                    "ALTER TABLE tbl_sprint ADD COLUMN IF NOT EXISTS completion_date DATE;",
                    "ALTER TABLE tbl_sprint ADD COLUMN IF NOT EXISTS completion_notes TEXT;",
                    "ALTER TABLE tbl_sprint ADD COLUMN IF NOT EXISTS carry_forward_tasks_count INTEGER DEFAULT 0;",
                    # tbl_task
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(50) DEFAULT 'Task';",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS parent_task_id UUID;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS start_date DATE;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS original_due_date DATE;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS due_date_changed_at TIMESTAMP;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS due_date_changed_by_id UUID;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS due_date_change_reason TEXT;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS delay_reason VARCHAR(100);",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS delay_remark TEXT;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS delay_remark_added_at TIMESTAMP;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS delay_remark_by_id UUID;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS team_leader_review TEXT;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS team_leader_reviewed_at TIMESTAMP;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS team_leader_reviewed_by_id UUID;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS escalation_reason TEXT;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS overdue_notified_lead BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS overdue_notified_pm BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE tbl_task ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
                    # tbl_commit
                    "ALTER TABLE tbl_commit ADD COLUMN IF NOT EXISTS task_id UUID;",
                    # tbl_task_history
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS user_id UUID;",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS old_value VARCHAR(255);",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS new_value VARCHAR(255);",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS details TEXT;",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
                    "ALTER TABLE tbl_task_history ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE tbl_task_history ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;",
                    "ALTER TABLE tbl_task_history ALTER COLUMN is_active SET DEFAULT TRUE;",
                    "ALTER TABLE tbl_task_history ALTER COLUMN is_deleted SET DEFAULT FALSE;",
                    "ALTER TABLE tbl_task_history ALTER COLUMN action DROP NOT NULL;",
                    # tbl_task_comment
                    "ALTER TABLE tbl_task_comment ADD COLUMN IF NOT EXISTS task_id UUID;",
                    "ALTER TABLE tbl_task_comment ADD COLUMN IF NOT EXISTS user_id UUID;",
                    "ALTER TABLE tbl_task_comment ADD COLUMN IF NOT EXISTS comment TEXT;",
                    "ALTER TABLE tbl_task_comment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
                    # tbl_project_health_history
                    """CREATE TABLE IF NOT EXISTS tbl_project_health_history (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        project_id UUID NOT NULL REFERENCES tbl_project(id),
                        overall_score INTEGER,
                        health_status VARCHAR(30),
                        sprint_task_score FLOAT,
                        github_score FLOAT,
                        code_quality_score FLOAT,
                        engineering_risk_score FLOAT,
                        metrics_breakdown TEXT,
                        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );"""
                ]
                for q in pg_queries:
                    try:
                        conn.execute(text(q))
                    except Exception as e:
                        pass
                conn.commit()

            elif dialect_name == 'sqlite':
                tables_cols = {
                    'tbl_sprint': [
                        ('completion_date', 'DATE'),
                        ('completion_notes', 'TEXT'),
                        ('carry_forward_tasks_count', 'INTEGER DEFAULT 0')
                    ],
                    'tbl_task': [
                        ('ticket_type', "VARCHAR(50) DEFAULT 'Task'"),
                        ('parent_task_id', 'VARCHAR(36)'),
                        ('start_date', 'DATE'),
                        ('original_due_date', 'DATE'),
                        ('due_date_changed_at', 'DATETIME'),
                        ('due_date_changed_by_id', 'VARCHAR(36)'),
                        ('due_date_change_reason', 'TEXT'),
                        ('progress', 'INTEGER DEFAULT 0'),
                        ('delay_reason', 'VARCHAR(100)'),
                        ('delay_remark', 'TEXT'),
                        ('delay_remark_added_at', 'DATETIME'),
                        ('delay_remark_by_id', 'VARCHAR(36)'),
                        ('team_leader_review', 'TEXT'),
                        ('team_leader_reviewed_at', 'DATETIME'),
                        ('team_leader_reviewed_by_id', 'VARCHAR(36)'),
                        ('escalation_level', 'INTEGER DEFAULT 0'),
                        ('escalation_reason', 'TEXT'),
                        ('escalated_at', 'DATETIME'),
                        ('overdue_notified_lead', 'BOOLEAN DEFAULT 0'),
                        ('overdue_notified_pm', 'BOOLEAN DEFAULT 0'),
                        ('updated_at', 'DATETIME')
                    ],
                    'tbl_commit': [
                        ('task_id', 'VARCHAR(36)')
                    ],
                    'tbl_task_history': [
                        ('user_id', 'VARCHAR(36)'),
                        ('action_type', 'VARCHAR(50)'),
                        ('action', "VARCHAR(100) DEFAULT 'STATUS_CHANGE'"),
                        ('old_value', 'VARCHAR(255)'),
                        ('new_value', 'VARCHAR(255)'),
                        ('details', 'TEXT'),
                        ('created_at', 'DATETIME'),
                        ('updated_at', 'DATETIME'),
                        ('is_active', 'BOOLEAN DEFAULT 1'),
                        ('is_deleted', 'BOOLEAN DEFAULT 0')
                    ]
                }

                for tbl, cols in tables_cols.items():
                    try:
                        existing_res = conn.execute(text(f"PRAGMA table_info({tbl})")).fetchall()
                        existing_cols = {row[1] for row in existing_res}
                        for col_name, col_type in cols:
                            if col_name not in existing_cols:
                                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col_name} {col_type};"))
                    except Exception:
                        pass
                conn.commit()
    except Exception as e:
        print(f"[SCHEMA SYNC ERROR] {e}")
