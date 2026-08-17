from extensions import db
from models import Role

def seed_database():
    db.create_all()

    # Seed Roles only if not present
    roles = ['ROLE_ADMIN', 'ROLE_PM', 'ROLE_LEAD', 'ROLE_DEV', 'ROLE_QA']
    for r_name in roles:
        if not Role.query.filter_by(code=r_name).first():
            db.session.add(Role(code=r_name, name=r_name, description=f"System Role: {r_name}"))
    db.session.commit()
    print("[DATABASE SEED] Connected to pre-existing tbl_user and tbl_role tables.")
