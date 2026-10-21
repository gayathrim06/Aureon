import os
import sys
from datetime import datetime, timedelta

from app import app
from extensions import db
from models import Notification, User

def seed_notifications():
    with app.app_context():
        admin = User.query.filter_by(email='admin@aureon.com').first()
        pm = User.query.filter_by(email='gopika@aureon.com').first()
        lead = User.query.filter_by(email='krish@aureon.com').first()

        seeds = [
            {
                'title': 'Radon and Pylint Static Code Analysis Completed',
                'message': 'Automated code quality scan finished on aureon-flask-backend. Health score: 94.2/100 (Grade A). Zero critical security vulnerabilities.',
                'notification_type': 'SECURITY',
                'recipient_id': admin.id if admin else None,
                'read': False,
                'created_at': datetime.utcnow() - timedelta(minutes=15)
            },
            {
                'title': 'Production Release Candidate Deployed',
                'message': 'Sprint 4 release candidate deployed to staging server. PostgreSQL migrations and schema tables synchronized.',
                'notification_type': 'DEPLOYMENT',
                'recipient_id': admin.id if admin else None,
                'read': False,
                'created_at': datetime.utcnow() - timedelta(minutes=45)
            },
            {
                'title': 'RBAC Security Matrix Policy Enforced',
                'message': 'Role permissions matrix synchronized across all 5 workspace tiers (ADMIN, PM, LEAD, DEV, QA).',
                'notification_type': 'SECURITY',
                'recipient_id': None,
                'read': False,
                'created_at': datetime.utcnow() - timedelta(hours=2)
            },
            {
                'title': 'New Enterprise Project Initialized',
                'message': 'Project Healthcare and Patient Management Portal created with High priority and assigned to Team Lead Krishna Deepesh.',
                'notification_type': 'PROJECT',
                'recipient_id': None,
                'read': False,
                'created_at': datetime.utcnow() - timedelta(hours=3)
            },
            {
                'title': 'QA Test Suite Automated Execution Passed',
                'message': 'Regression test suite (48 test cases) completed with 100% pass rate. 0 blocking defects detected.',
                'notification_type': 'BUG',
                'recipient_id': None,
                'read': False,
                'created_at': datetime.utcnow() - timedelta(hours=5)
            },
            {
                'title': 'Sprint 4 Deliverables Velocity On Track',
                'message': 'Team velocity reached 42 story points. 14 of 16 planned deliverables completed on schedule.',
                'notification_type': 'TASK',
                'recipient_id': None,
                'read': True,
                'created_at': datetime.utcnow() - timedelta(days=1)
            },
            {
                'title': 'Aureon Git Lite Repository Synced',
                'message': 'Commit histories, branch metadata, and push events successfully synchronized with GitHub origin main.',
                'notification_type': 'SYSTEM',
                'recipient_id': admin.id if admin else None,
                'read': True,
                'created_at': datetime.utcnow() - timedelta(days=1, hours=4)
            },
            {
                'title': 'Database Backup and Audit Trail Integrity Verified',
                'message': 'PostgreSQL transaction ledger and immutable audit logs verified. 0 tampering detected.',
                'notification_type': 'SECURITY',
                'recipient_id': admin.id if admin else None,
                'read': True,
                'created_at': datetime.utcnow() - timedelta(days=2)
            }
        ]

        inserted = 0
        for s in seeds:
            existing = Notification.query.filter_by(title=s['title']).first()
            if not existing:
                n = Notification(
                    title=s['title'],
                    message=s['message'],
                    notification_type=s['notification_type'],
                    recipient_id=s['recipient_id'],
                    read=s['read'],
                    created_at=s['created_at']
                )
                db.session.add(n)
                inserted += 1
            else:
                existing.read = s['read']
        db.session.commit()
        print(f'Successfully added/updated {inserted} notifications in database.')

if __name__ == '__main__':
    seed_notifications()
