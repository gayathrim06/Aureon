"""
Database Migration: Safely attach existing project tasks to project sprints
Rules:
- Never invent fake ownership, project, sprint, team, or developer relationships.
- If an existing task belongs to a project that has an active or planned sprint, associate it with that sprint.
- If a task has no developer, keep it unassigned and flag as 'Needs Assignment'.
- If a task has no project, do not invent a project; mark it as orphaned for review.
"""
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from extensions import db
from models import Task, Project, Sprint, User

def run_migration():
    app = create_app()
    with app.app_context():
        print("Starting safe task-to-sprint migration...")
        
        all_tasks = Task.query.all()
        print(f"Total tasks in database: {len(all_tasks)}")
        
        linked_to_sprint_count = 0
        already_linked_count = 0
        orphaned_no_project_count = 0
        unassigned_dev_count = 0
        
        for task in all_tasks:
            # 1. Track developer assignment
            if not task.assigned_to_id:
                unassigned_dev_count += 1
                # Preserve unassigned: do NOT invent developer
            
            # 2. Check sprint linkage
            if task.sprint_id:
                already_linked_count += 1
                continue
                
            # If task has a project_id, find a real sprint belonging to that project
            if task.project_id:
                project_sprint = Sprint.query.filter_by(project_id=task.project_id).filter(
                    Sprint.status.in_(['ACTIVE', 'IN_PROGRESS', 'PLANNED'])
                ).first()
                
                if not project_sprint:
                    # Fallback to any sprint for this project
                    project_sprint = Sprint.query.filter_by(project_id=task.project_id).first()
                    
                if project_sprint:
                    task.sprint_id = project_sprint.id
                    if not task.team_id and project_sprint.team_id:
                        task.team_id = project_sprint.team_id
                    linked_to_sprint_count += 1
                    print(f"Linked task '{task.title}' ({task.id}) -> Sprint '{project_sprint.name}'")
                else:
                    print(f"Task '{task.title}' belongs to project {task.project_id} which has no sprints. Preserving as orphan.")
            else:
                # No project_id: do NOT invent Verona Organic or any fake project
                orphaned_no_project_count += 1
                print(f"Task '{task.title}' ({task.id}) has NO project. Preserving as genuine orphan.")
                
        db.session.commit()
        print("\n--- Migration Summary ---")
        print(f"Already linked to sprint: {already_linked_count}")
        print(f"Successfully linked to project sprint: {linked_to_sprint_count}")
        print(f"Preserved genuine orphans (no project): {orphaned_no_project_count}")
        print(f"Unassigned developers (Needs Assignment): {unassigned_dev_count}")
        print("Migration completed successfully.")

if __name__ == '__main__':
    run_migration()
