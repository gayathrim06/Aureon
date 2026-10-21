import uuid
from datetime import datetime, timedelta, date
from app import app
from extensions import db
from models import (
    Project, User, Team, TeamMember, ProjectMember,
    GitHubRepository, GitHubCommit, GitHubPullRequest, GitHubContributor, Repository
)

def seed_git_lite_repositories():
    with app.app_context():
        print("[GIT LITE SEED] Initializing all 5 enterprise project repositories...")

        # Definition of 5 enterprise projects with Aureon Git Lite specs
        project_repo_configs = [
            {
                'project_name': 'THRIFT-IN-CAMPUS',
                'repo_name': 'thrift-in-campus',
                'description': 'A modern full-stack campus marketplace for college students to buy and sell pre-owned gear.',
                'language': 'TypeScript / React',
                'team_name': 'Frontend UI Squad',
                'default_branch': 'main',
                'branches': ['main', 'develop', 'feature/campus-auth', 'feature/item-catalog', 'feature/checkout-flow'],
                'members': [
                    ('krish@aureon.com', 'Krishna Deepesh', 'TEAM_LEAD'),
                    ('sainu@aureon.com', 'Sainu Anna Sajan', 'DEVELOPER'),
                    ('ram.kumar@aureon.com', 'Ram Kumar', 'DEVELOPER'),
                    ('venu.qa@aureon.com', 'Venu QA', 'QA_ENGINEER')
                ],
                'commits': [
                    ('krish@aureon.com', 'Krishna Deepesh', 'chore(scaffold): initialize Thrift-in-Campus repository and Next.js project structure', 'main', 14),
                    ('sainu@aureon.com', 'Sainu Anna Sajan', 'feat(auth): integrate NextAuth student email domain verification (@campus.edu)', 'develop', 12),
                    ('ram.kumar@aureon.com', 'Ram Kumar', 'feat(marketplace): create product catalog grid with category filters and search', 'feature/item-catalog', 10),
                    ('venu.qa@aureon.com', 'Venu QA', 'test(e2e): add automated Cypress test specs for student onboarding and listings', 'develop', 8),
                    ('sainu@aureon.com', 'Sainu Anna Sajan', 'feat(checkout): implement in-person hostel meetup scheduling and payment escrows', 'feature/checkout-flow', 6),
                    ('ram.kumar@aureon.com', 'Ram Kumar', 'fix(images): integrate Cloudinary image optimization for student gear uploads', 'develop', 4),
                    ('krish@aureon.com', 'Krishna Deepesh', 'merge: resolve PR #12 and release v1.2 candidate to staging environment', 'main', 1)
                ],
                'prs': [
                    (1, 'feat(auth): student verification flow', 'sainu@aureon.com', 'feature/campus-auth', 'develop', 'MERGED', 'APPROVED'),
                    (2, 'feat(marketplace): campus product listings', 'ram.kumar@aureon.com', 'feature/item-catalog', 'develop', 'MERGED', 'APPROVED'),
                    (3, 'feat(checkout): in-person meetup scheduler', 'sainu@aureon.com', 'feature/checkout-flow', 'develop', 'OPEN', 'PENDING')
                ]
            },
            {
                'project_name': 'FinPulse Wealth Engine',
                'repo_name': 'finpulse-wealth-engine',
                'description': 'High-throughput algorithmic portfolio management and financial intelligence engine.',
                'language': 'Python / PostgreSQL',
                'team_name': 'Backend Data Engine',
                'default_branch': 'main',
                'branches': ['main', 'develop', 'feature/portfolio-analytics', 'feature/trading-engine', 'feature/db-indexer'],
                'members': [
                    ('david.c@aureon.com', 'David Chen', 'TEAM_LEAD'),
                    ('priya.s@aureon.com', 'Priya Sharma', 'DEVELOPER'),
                    ('rinta@aureon.com', 'Rinta Thomas', 'DEVELOPER'),
                    ('jiya@aureon.com', 'Jiya Thomas', 'QA_ENGINEER')
                ],
                'commits': [
                    ('david.c@aureon.com', 'David Chen', 'chore(arch): scaffold distributed data streaming pipeline with Apache Kafka', 'main', 13),
                    ('priya.s@aureon.com', 'Priya Sharma', 'feat(portfolio): implement Sharpe ratio and portfolio risk-adjusted return models', 'develop', 11),
                    ('rinta@aureon.com', 'Rinta Thomas', 'feat(db): optimize PostgreSQL partitioned tables for market time-series ingest', 'feature/db-indexer', 9),
                    ('jiya@aureon.com', 'Jiya Thomas', 'test(perf): benchmark trading execution latency under 10k transactions/sec', 'develop', 7),
                    ('priya.s@aureon.com', 'Priya Sharma', 'feat(analytics): add Monte Carlo simulation engine for wealth retirement projections', 'feature/portfolio-analytics', 5),
                    ('rinta@aureon.com', 'Rinta Thomas', 'refactor(api): stream live financial tickers over resilient WebSockets', 'develop', 3),
                    ('david.c@aureon.com', 'David Chen', 'merge: merge develop into main and deploy FinPulse Release v2.0-RC', 'main', 1)
                ],
                'prs': [
                    (1, 'feat(portfolio): risk-adjusted metric calculation', 'priya.s@aureon.com', 'feature/portfolio-analytics', 'develop', 'MERGED', 'APPROVED'),
                    (2, 'feat(db): time-series indexing optimization', 'rinta@aureon.com', 'feature/db-indexer', 'develop', 'MERGED', 'APPROVED'),
                    (3, 'feat(trading): algorithmic trade execution', 'priya.s@aureon.com', 'feature/trading-engine', 'develop', 'OPEN', 'PENDING')
                ]
            },
            {
                'project_name': 'AuraCloud Telemetry Mesh',
                'repo_name': 'auracloud-telemetry-mesh',
                'description': 'Distributed multi-cloud telemetry and Kubernetes service mesh observability framework.',
                'language': 'Go / TypeScript',
                'team_name': 'Core Infrastructure Guild',
                'default_branch': 'main',
                'branches': ['main', 'develop', 'feature/kubernetes-operator', 'feature/prom-collector', 'feature/mesh-proxy'],
                'members': [
                    ('vikram.p@aureon.com', 'Vikram Patel', 'TEAM_LEAD'),
                    ('alex.r@aureon.com', 'Alex Rivera', 'DEVELOPER'),
                    ('michael.b@aureon.com', 'Michael Brown', 'DEVELOPER'),
                    ('ananya.v@aureon.com', 'Ananya Varma', 'QA_ENGINEER')
                ],
                'commits': [
                    ('vikram.p@aureon.com', 'Vikram Patel', 'chore(init): configure Envoy service mesh daemon and eBPF kernel probes', 'main', 15),
                    ('alex.r@aureon.com', 'Alex Rivera', 'feat(k8s): build custom Kubernetes CRD controller for telemetry collection', 'feature/kubernetes-operator', 12),
                    ('michael.b@aureon.com', 'Michael Brown', 'feat(metrics): Prometheus endpoint exporter with distributed trace propagation', 'feature/prom-collector', 9),
                    ('ananya.v@aureon.com', 'Ananya Varma', 'test(chaos): chaos mesh testing under simulated network partition and latency spikes', 'develop', 6),
                    ('alex.r@aureon.com', 'Alex Rivera', 'feat(proxy): high-performance zero-copy gRPC proxy for telemetry ingestion', 'feature/mesh-proxy', 4),
                    ('vikram.p@aureon.com', 'Vikram Patel', 'ci(security): embed Trivy vulnerability scanning into build pipeline', 'main', 2)
                ],
                'prs': [
                    (1, 'feat(k8s): CRD telemetry operator', 'alex.r@aureon.com', 'feature/kubernetes-operator', 'develop', 'MERGED', 'APPROVED'),
                    (2, 'feat(metrics): OpenTelemetry collector integration', 'michael.b@aureon.com', 'feature/prom-collector', 'develop', 'MERGED', 'APPROVED'),
                    (3, 'feat(proxy): Envoy eBPF proxy routing', 'alex.r@aureon.com', 'feature/mesh-proxy', 'develop', 'OPEN', 'PENDING')
                ]
            },
            {
                'project_name': 'MedShield Health Core',
                'repo_name': 'medshield-health-core',
                'description': 'HIPAA-compliant EHR workflows, encrypted diagnostics, and FHIR standard interoperability platform.',
                'language': 'Java / React',
                'team_name': 'Healthcare Systems Squad',
                'default_branch': 'main',
                'branches': ['main', 'develop', 'feature/fhir-api-core', 'feature/hipaa-audit-ledger', 'feature/patient-portal'],
                'members': [
                    ('krish@aureon.com', 'Krishna Deepesh', 'TEAM_LEAD'),
                    ('sneha.r@aureon.com', 'Sneha Roy', 'DEVELOPER'),
                    ('arunima@aureon.com', 'Arunima', 'DEVELOPER'),
                    ('ann.m@aureon.com', 'Ann Maria', 'QA_ENGINEER')
                ],
                'commits': [
                    ('krish@aureon.com', 'Krishna Deepesh', 'chore(security): establish AES-256 field-level encryption for patient records', 'main', 14),
                    ('sneha.r@aureon.com', 'Sneha Roy', 'feat(fhir): implement HL7 FHIR v4 REST endpoints for electronic medical records', 'feature/fhir-api-core', 10),
                    ('arunima@aureon.com', 'Arunima', 'feat(audit): immutable append-only audit trail for medical data access logs', 'feature/hipaa-audit-ledger', 8),
                    ('ann.m@aureon.com', 'Ann Maria', 'test(compliance): execute HIPAA automated regulatory compliance assertions', 'develop', 6),
                    ('sneha.r@aureon.com', 'Sneha Roy', 'feat(portal): patient telemetry dashboard with authenticated doctor messaging', 'feature/patient-portal', 4),
                    ('krish@aureon.com', 'Krishna Deepesh', 'merge: tag medshield-core v1.0.4 with full cryptographic verification', 'main', 1)
                ],
                'prs': [
                    (1, 'feat(fhir): HL7 patient data bridge', 'sneha.r@aureon.com', 'feature/fhir-api-core', 'develop', 'MERGED', 'APPROVED'),
                    (2, 'feat(audit): HIPAA compliance access logging', 'arunima@aureon.com', 'feature/hipaa-audit-ledger', 'develop', 'MERGED', 'APPROVED'),
                    (3, 'feat(portal): patient telemetry UI', 'sneha.r@aureon.com', 'feature/patient-portal', 'develop', 'OPEN', 'PENDING')
                ]
            },
            {
                'project_name': 'CyberGuard Zero Trust',
                'repo_name': 'cyberguard-zero-trust',
                'description': 'Zero Trust policy enforcement, SIEM audit streams, and real-time vulnerability hardening.',
                'language': 'Rust / Python',
                'team_name': 'Cyber Defense Squad',
                'default_branch': 'main',
                'branches': ['main', 'develop', 'feature/zero-trust-gateway', 'feature/siem-alert-stream', 'feature/crypto-vault'],
                'members': [
                    ('vikram.p@aureon.com', 'Vikram Patel', 'TEAM_LEAD'),
                    ('michael.b@aureon.com', 'Michael Brown', 'DEVELOPER'),
                    ('arunima@aureon.com', 'Arunima', 'DEVELOPER'),
                    ('venu.qa@aureon.com', 'Venu QA', 'QA_ENGINEER')
                ],
                'commits': [
                    ('vikram.p@aureon.com', 'Vikram Patel', 'chore(arch): scaffold zero-trust mutual TLS token authorization service in Rust', 'main', 14),
                    ('michael.b@aureon.com', 'Michael Brown', 'feat(gateway): implement adaptive risk-based authentication policy engine', 'feature/zero-trust-gateway', 11),
                    ('arunima@aureon.com', 'Arunima', 'feat(siem): stream real-time threat detection telemetry into Splunk/Elastic', 'feature/siem-alert-stream', 8),
                    ('venu.qa@aureon.com', 'Venu QA', 'test(sec): automated penetration testing against token forgery & replay attacks', 'develop', 5),
                    ('michael.b@aureon.com', 'Michael Brown', 'feat(vault): hardware security module (HSM) key rotation and secret sealing', 'feature/crypto-vault', 3),
                    ('vikram.p@aureon.com', 'Vikram Patel', 'release: promote CyberGuard zero-trust engine v1.1 to production mesh', 'main', 1)
                ],
                'prs': [
                    (1, 'feat(gateway): risk-based authentication', 'michael.b@aureon.com', 'feature/zero-trust-gateway', 'develop', 'MERGED', 'APPROVED'),
                    (2, 'feat(siem): high-speed telemetry streaming', 'arunima@aureon.com', 'feature/siem-alert-stream', 'develop', 'MERGED', 'APPROVED'),
                    (3, 'feat(vault): HSM secret management', 'michael.b@aureon.com', 'feature/crypto-vault', 'develop', 'OPEN', 'PENDING')
                ]
            }
        ]

        for cfg in project_repo_configs:
            # 1. Locate or create Project
            proj = Project.query.filter(Project.name.ilike(f"%{cfg['project_name']}%")).first()
            if not proj:
                print(f"Creating project {cfg['project_name']}...")
                proj = Project(
                    id=uuid.uuid4(),
                    name=cfg['project_name'],
                    description=cfg['description'],
                    status='IN_PROGRESS',
                    priority='HIGH',
                    health_score=94,
                    start_date=date(2026, 9, 1),
                    target_deadline=date(2026, 12, 1),
                    is_active=True,
                    is_deleted=False
                )
                db.session.add(proj)
                db.session.flush()

            # Ensure project member mappings
            for u_email, u_name, role_in_proj in cfg['members']:
                u = User.query.filter_by(email=u_email).first()
                if u:
                    pm_rec = ProjectMember.query.filter_by(project_id=proj.id, user_id=u.id).first()
                    if not pm_rec:
                        pm_rec = ProjectMember(
                            id=uuid.uuid4(),
                            project_id=proj.id,
                            user_id=u.id,
                            role_in_project=role_in_proj,
                            is_active=True,
                            is_deleted=False
                        )
                        db.session.add(pm_rec)

            # 2. Locate or create GitHubRepository
            repo_full_name = f"aureon-maker/{cfg['repo_name']}"
            gh_repo = GitHubRepository.query.filter_by(repository_name=cfg['repo_name']).first()
            if not gh_repo:
                gh_repo = GitHubRepository(
                    id=uuid.uuid4(),
                    project_id=proj.id,
                    owner='aureon-maker',
                    repository_name=cfg['repo_name'],
                    repository_url=f"https://github.com/aureon-maker/{cfg['repo_name']}",
                    default_branch=cfg['default_branch'],
                    description=cfg['description'],
                    visibility='public',
                    language=cfg['language'],
                    stars=3,
                    forks=1,
                    open_issues=len([p for p in cfg['prs'] if p[5] == 'OPEN']),
                    is_active=True,
                    last_synced_at=datetime.utcnow()
                )
                db.session.add(gh_repo)
                db.session.flush()
                print(f"Created GitHubRepository: {gh_repo.repository_name}")
            else:
                gh_repo.project_id = proj.id
                gh_repo.is_active = True
                gh_repo.owner = 'aureon-maker'
                gh_repo.repository_url = f"https://github.com/aureon-maker/{cfg['repo_name']}"
                gh_repo.last_synced_at = datetime.utcnow()

            # 3. Mirror in legacy Repository table
            legacy_repo = Repository.query.filter_by(name=cfg['repo_name']).first()
            if not legacy_repo:
                legacy_repo = Repository(
                    id=gh_repo.id,
                    project_id=proj.id,
                    name=cfg['repo_name'],
                    repository_name=cfg['repo_name'],
                    url=gh_repo.repository_url,
                    repository_url=gh_repo.repository_url,
                    provider='GitHub',
                    default_branch=gh_repo.default_branch,
                    status='CONNECTED',
                    connection_status='CONNECTED',
                    last_synced=datetime.utcnow()
                )
                db.session.add(legacy_repo)
            else:
                legacy_repo.project_id = proj.id
                legacy_repo.url = gh_repo.repository_url
                legacy_repo.repository_url = gh_repo.repository_url

            # 4. Seed Commits strictly authored by assigned team members
            existing_shas = {c.commit_sha for c in gh_repo.commits}
            now = datetime.utcnow()

            for idx, (auth_email, auth_name, msg, branch, days_ago) in enumerate(cfg['commits']):
                sha = f"{cfg['repo_name'][:4]}{idx+1}a{hash(msg) % 1000000:06x}f{idx:02x}"[:40]
                if sha not in existing_shas:
                    c_date = now - timedelta(days=days_ago, hours=idx*2)
                    commit = GitHubCommit(
                        id=uuid.uuid4(),
                        repository_id=gh_repo.id,
                        github_commit_id=sha,
                        commit_sha=sha,
                        author_name=auth_name,
                        author_email=auth_email,
                        branch=branch,
                        commit_message=msg,
                        commit_date=c_date,
                        commit_url=f"https://github.com/aureon-maker/{cfg['repo_name']}/commit/{sha[:7]}"
                    )
                    db.session.add(commit)
                    existing_shas.add(sha)
                else:
                    # Update branch for existing commits
                    for c in gh_repo.commits:
                        if c.commit_sha == sha:
                            c.branch = branch

            # 5. Seed Pull Requests
            existing_prs = {pr.pr_number for pr in gh_repo.pull_requests}
            for (num, title, author_email, src_b, tgt_b, state, rev_status) in cfg['prs']:
                if num not in existing_prs:
                    pr = GitHubPullRequest(
                        id=uuid.uuid4(),
                        repository_id=gh_repo.id,
                        github_pr_id=1000 + num,
                        pr_number=num,
                        title=title,
                        author=author_email.split('@')[0],
                        state=state.lower(),
                        source_branch=src_b,
                        target_branch=tgt_b,
                        created_at=now - timedelta(days=num * 3),
                        review_status=rev_status
                    )
                    db.session.add(pr)
                    existing_prs.add(num)

            # 6. Seed Contributors from team members
            existing_contribs = {c.username.lower() for c in gh_repo.contributors}
            for u_email, u_name, role in cfg['members']:
                uname = u_email.split('@')[0]
                if uname.lower() not in existing_contribs:
                    contrib = GitHubContributor(
                        id=uuid.uuid4(),
                        repository_id=gh_repo.id,
                        github_user_id=hash(u_email) % 1000000,
                        username=uname,
                        display_name=u_name,
                        contributions=len([c for c in cfg['commits'] if c[0] == u_email]) * 3 + 2,
                        profile_url=f"https://github.com/aureon-maker",
                        avatar_url=f"https://ui-avatars.com/api/?name={u_name.replace(' ', '+')}&background=4f46e5&color=fff"
                    )
                    db.session.add(contrib)
                    existing_contribs.add(uname.lower())

        db.session.commit()
        print("[GIT LITE SEED] Successfully seeded all 5 repositories, commits, branches, and team members!")

if __name__ == '__main__':
    seed_git_lite_repositories()
