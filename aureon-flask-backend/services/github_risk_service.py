from datetime import datetime, timezone

def _normalize_dt(dt_val):
    """Safely converts string or datetime to timezone-aware UTC datetime."""
    if not dt_val:
        return None
    try:
        if isinstance(dt_val, str):
            clean_iso = dt_val.replace('Z', '+00:00')
            dt = datetime.fromisoformat(clean_iso)
        elif isinstance(dt_val, datetime):
            dt = dt_val
        else:
            return None

        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


class GitHubRiskService:
    """
    Deterministic, Rule-Based Repository Risk & Health Analyzer.
    Strictly Non-AI. Implements rule evaluation for:
    - Development inactivity & stale commits
    - Overdue / Unreviewed Pull Requests
    - Bus factor & contributor centralization
    - Issue backlog accumulation
    - Overall repository health scoring (0 - 100)
    """

    @classmethod
    def evaluate_repository_risks(cls, repo_dict, commits, pull_requests, contributors):
        """
        Evaluates rule-based risks for a repository and calculates health score.
        Args:
            repo_dict: Dictionary or object with repository metadata (open_issues, stars, etc.)
            commits: List of commit dictionaries
            pull_requests: List of pull request dictionaries
            contributors: List of contributor dictionaries
        Returns:
            dict containing health_score, health_status, risks list, and metrics summary.
        """
        risks = []
        health_score = 100
        now = datetime.now(timezone.utc)

        # ━━━ 1. INACTIVITY & STALE COMMIT DETECTION ━━━
        latest_commit_date = None
        if commits:
            for c in commits:
                c_dt = _normalize_dt(c.get('commit_date'))
                if c_dt:
                    if latest_commit_date is None or c_dt > latest_commit_date:
                        latest_commit_date = c_dt

        days_since_last_commit = None
        if latest_commit_date:
            days_since_last_commit = max(0, (now - latest_commit_date).days)
            if days_since_last_commit >= 30:
                health_score -= 25
                risks.append({
                    'id': 'RISK-INACTIVE-30',
                    'category': 'DEVELOPMENT_VELOCITY',
                    'type': 'DORMANT_REPOSITORY',
                    'severity': 'HIGH',
                    'title': 'Dormant Development Activity',
                    'description': f"No commits detected in the last {days_since_last_commit} days. Repository appears inactive.",
                    'recommendation': 'Review project schedule and re-assign tasks or conduct a sprint check-in.'
                })
            elif days_since_last_commit >= 14:
                health_score -= 12
                risks.append({
                    'id': 'RISK-INACTIVE-14',
                    'category': 'DEVELOPMENT_VELOCITY',
                    'type': 'INACTIVITY_WARNING',
                    'severity': 'MEDIUM',
                    'title': 'Stale Repository Activity',
                    'description': f"Latest commit was {days_since_last_commit} days ago. Development velocity has slowed.",
                    'recommendation': 'Check in with project team leads regarding milestone progression.'
                })
        elif not commits:
            health_score -= 15
            risks.append({
                'id': 'RISK-NO-COMMITS',
                'category': 'DEVELOPMENT_VELOCITY',
                'type': 'EMPTY_REPOSITORY',
                'severity': 'MEDIUM',
                'title': 'No Recent Commits Recorded',
                'description': 'No commit activity tracked on the primary branch.',
                'recommendation': 'Verify that commits are being pushed to the default branch.'
            })

        # ━━━ 2. STALE / UNREVIEWED PULL REQUESTS ━━━
        open_prs = [pr for pr in pull_requests if pr.get('state') == 'open']
        stale_prs_count = 0

        for pr in open_prs:
            pr_dt = _normalize_dt(pr.get('created_at'))
            if pr_dt:
                pr_age_days = max(0, (now - pr_dt).days)
                if pr_age_days >= 7:
                    stale_prs_count += 1
                    severity = 'HIGH' if pr_age_days >= 21 else 'MEDIUM'
                    pr_num = pr.get('pr_number', '')
                    pr_title = pr.get('title', 'Untitled PR')
                    risks.append({
                        'id': f"RISK-STALE-PR-{pr_num}",
                        'category': 'CODE_REVIEW',
                        'type': 'STALE_PULL_REQUEST',
                        'severity': severity,
                        'title': f"Unreviewed PR #{pr_num} ({pr_age_days} days old)",
                        'description': f"PR #{pr_num} '{pr_title}' has been open for {pr_age_days} days without being merged.",
                        'recommendation': f"Assign peer reviewers or resolve merge conflicts for PR #{pr_num}."
                    })

        if stale_prs_count > 0:
            health_score -= min(25, stale_prs_count * 5)

        # ━━━ 3. CONTRIBUTOR CONCENTRATION / BUS FACTOR ━━━
        if contributors:
            total_contributions = sum(c.get('contributions', 0) for c in contributors)
            if total_contributions >= 5:
                top_contributor = max(contributors, key=lambda c: c.get('contributions', 0))
                top_ratio = top_contributor.get('contributions', 0) / total_contributions
                if top_ratio >= 0.85 and len(contributors) > 1:
                    health_score -= 10
                    pct = round(top_ratio * 100, 1)
                    risks.append({
                        'id': 'RISK-BUS-FACTOR',
                        'category': 'TEAM_DEPENDENCY',
                        'type': 'BUS_FACTOR_RISK',
                        'severity': 'MEDIUM',
                        'title': 'High Contributor Centralization',
                        'description': f"Developer @{top_contributor.get('username')} authored {pct}% of recorded contributions.",
                        'recommendation': 'Encourage pair programming and cross-training to distribute domain knowledge.'
                    })
                elif len(contributors) == 1 and total_contributions >= 10:
                    health_score -= 8
                    risks.append({
                        'id': 'RISK-SINGLE-AUTHOR',
                        'category': 'TEAM_DEPENDENCY',
                        'type': 'SINGLE_CONTRIBUTOR_RISK',
                        'severity': 'LOW',
                        'title': 'Single Contributor Repository',
                        'description': 'All contributions are from a single developer.',
                        'recommendation': 'Add additional team members to provide code reviews and redundancy.'
                    })

        # ━━━ 4. ISSUE BACKLOG RISK ━━━
        open_issues = repo_dict.get('open_issues', 0) if isinstance(repo_dict, dict) else getattr(repo_dict, 'open_issues', 0)
        if open_issues >= 30:
            health_score -= 12
            risks.append({
                'id': 'RISK-HIGH-ISSUES-30',
                'category': 'QUALITY_BACKLOG',
                'type': 'HIGH_ISSUE_BACKLOG',
                'severity': 'MEDIUM',
                'title': 'High Issue Backlog',
                'description': f"Repository has {open_issues} open issues pending resolution.",
                'recommendation': 'Conduct backlog grooming to prioritize and triage outstanding issues.'
            })
        elif open_issues >= 15:
            health_score -= 5
            risks.append({
                'id': 'RISK-MOD-ISSUES-15',
                'category': 'QUALITY_BACKLOG',
                'type': 'MODERATE_ISSUE_BACKLOG',
                'severity': 'LOW',
                'title': 'Moderate Open Issue Count',
                'description': f"Repository has {open_issues} open issues.",
                'recommendation': 'Ensure open issues are mapped to active sprint backlogs.'
            })

        # Clamp health score to 15 - 100
        health_score = max(15, min(100, health_score))

        # Classification
        if health_score >= 80:
            health_status = 'HEALTHY'
        elif health_score >= 60:
            health_status = 'WARNING'
        else:
            health_status = 'AT_RISK'

        return {
            'health_score': health_score,
            'health_status': health_status,
            'risks_count': len(risks),
            'risks': risks,
            'metrics_summary': {
                'days_since_last_commit': days_since_last_commit,
                'open_pull_requests': len(open_prs),
                'stale_pull_requests': stale_prs_count,
                'tracked_contributors': len(contributors),
                'open_issues': open_issues
            }
        }
