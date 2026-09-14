import os
import re
import base64
import requests
from config import Config

class GitHubIntegrationError(Exception):
    """Base exception for GitHub API errors."""
    pass

class GitHubResourceNotFound(GitHubIntegrationError):
    """Raised when a GitHub repository, branch, or file does not exist or is inaccessible."""
    pass

class GitHubAuthenticationError(GitHubIntegrationError):
    """Raised when GitHub token authentication fails (HTTP 401)."""
    pass

class GitHubRateLimitExceeded(GitHubIntegrationError):
    """Raised when GitHub API rate limit has been reached (HTTP 403 rate-limit)."""
    pass

class GitHubPermissionDenied(GitHubIntegrationError):
    """Raised when permissions are insufficient to access the resource."""
    pass

class GitHubNetworkError(GitHubIntegrationError):
    """Raised on connection timeout or network failure."""
    pass


class GitHubService:
    """
    Dedicated Service Layer for GitHub REST API Integration.
    Purely deterministic & non-AI. Handles URL parsing, paginated API fetching,
    branch/commit/PR/contributor synchronization, and source code tree analysis.
    """

    # Supported source code language extensions
    LANGUAGE_EXTENSIONS = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript (React)',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript (React)',
        '.java': 'Java',
        '.c': 'C',
        '.cpp': 'C++',
        '.cc': 'C++',
        '.h': 'C/C++ Header',
        '.hpp': 'C++ Header',
        '.cs': 'C#',
        '.php': 'PHP',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.rs': 'Rust',
        '.kt': 'Kotlin',
        '.swift': 'Swift',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.sql': 'SQL',
        '.sh': 'Shell'
    }

    # Ignored folders and artifacts
    IGNORE_PREFIXES = (
        '.git/', 'node_modules/', 'venv/', '.venv/', 'env/',
        '__pycache__/', 'dist/', 'build/', 'coverage/', '.pytest_cache/',
        '.idea/', '.vscode/', '.next/', '.nuxt/', '.turbo/'
    )

    IGNORE_FILES = (
        '.env', '.gitignore', '.gitattributes', 'package-lock.json',
        'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock', 'Gemfile.lock'
    )

    @classmethod
    def get_api_base_url(cls):
        return (getattr(Config, 'GITHUB_API_URL', None) or os.getenv('GITHUB_API_URL') or 'https://api.github.com').rstrip('/')

    @classmethod
    def get_headers(cls):
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Aureon-Engineering-Intelligence/1.0'
        }
        token = getattr(Config, 'GITHUB_TOKEN', None) or os.getenv('GITHUB_TOKEN')
        if token and token.strip():
            headers['Authorization'] = f"Bearer {token.strip()}"
        return headers

    @classmethod
    def parse_github_url(cls, url):
        """
        Parses GitHub repository URLs and extracts (owner, repository_name).
        Supports:
          - https://github.com/owner/repo
          - http://github.com/owner/repo.git
          - https://github.com/owner/repo/
          - owner/repo
          - git@github.com:owner/repo.git
        """
        if not url or not isinstance(url, str):
            raise ValueError("Repository URL is required.")

        raw = url.strip()

        # Handle SSH style git@github.com:owner/repo.git
        ssh_match = re.match(r'^git@github\.com:([\w\-\.]+)/([\w\-\.]+?)(?:\.git)?$', raw)
        if ssh_match:
            return ssh_match.group(1), ssh_match.group(2)

        # Handle full URL or shorthand
        clean = re.sub(r'^(https?://)?(www\.)?github\.com/', '', raw)
        clean = re.sub(r'\.git$', '', clean)
        clean = clean.strip('/')

        parts = clean.split('/')
        if len(parts) >= 2 and parts[0] and parts[1]:
            owner = parts[0].strip()
            repo = parts[1].strip()
            # Basic validation of GitHub usernames and repo naming rules
            if re.match(r'^[a-zA-Z0-9\-\._]+$', owner) and re.match(r'^[a-zA-Z0-9\-\._]+$', repo):
                return owner, repo

        raise ValueError(f"Invalid GitHub repository URL: '{url}'. Expected format: https://github.com/owner/repository")

    @classmethod
    def _handle_response(cls, response, resource_name="resource"):
        """Validates HTTP response and raises specific domain exceptions."""
        if response.status_code in (200, 201):
            return response.json()

        if response.status_code == 404:
            raise GitHubResourceNotFound(
                f"GitHub {resource_name} not found. Verify repository name and ensure it is public or authorized."
            )

        if response.status_code == 401:
            raise GitHubAuthenticationError(
                "GitHub authentication failed. Invalid or expired GITHUB_TOKEN."
            )

        if response.status_code == 403:
            remaining = response.headers.get('X-RateLimit-Remaining')
            if remaining == '0':
                reset_time = response.headers.get('X-RateLimit-Reset', 'soon')
                raise GitHubRateLimitExceeded(
                    f"GitHub API rate limit exceeded (reset epoch: {reset_time}). Add a GITHUB_TOKEN to your environment."
                )
            error_msg = response.json().get('message', 'Access forbidden.') if response.text else 'Access forbidden.'
            raise GitHubPermissionDenied(f"GitHub permission denied: {error_msg}")

        try:
            error_data = response.json()
            message = error_data.get('message', response.text)
        except Exception:
            message = response.text

        raise GitHubIntegrationError(f"GitHub API error (HTTP {response.status_code}): {message}")

    @classmethod
    def get_repository(cls, owner, repo):
        """Fetches repository metadata from GitHub API."""
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}"
        try:
            resp = requests.get(url, headers=cls.get_headers(), timeout=12)
            data = cls._handle_response(resp, resource_name=f"repository '{owner}/{repo}'")
            return {
                'github_repository_id': data.get('id'),
                'owner': data.get('owner', {}).get('login') or owner,
                'repository_name': data.get('name') or repo,
                'full_name': data.get('full_name') or f"{owner}/{repo}",
                'repository_url': data.get('html_url') or f"https://github.com/{owner}/{repo}",
                'default_branch': data.get('default_branch') or 'main',
                'description': data.get('description') or '',
                'visibility': 'private' if data.get('private') else 'public',
                'language': data.get('language') or 'Other',
                'stars': data.get('stargazers_count', 0),
                'forks': data.get('forks_count', 0),
                'open_issues': data.get('open_issues_count', 0),
                'created_at': data.get('created_at'),
                'updated_at': data.get('updated_at'),
                'pushed_at': data.get('pushed_at')
            }
        except requests.exceptions.Timeout:
            raise GitHubNetworkError(f"Connection timeout while connecting to GitHub repository '{owner}/{repo}'.")
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Network error communicating with GitHub: {str(e)}")

    @classmethod
    def get_branches(cls, owner, repo, per_page=100):
        """Fetches list of repository branches."""
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/branches"
        try:
            resp = requests.get(url, headers=cls.get_headers(), params={'per_page': per_page}, timeout=12)
            data = cls._handle_response(resp, resource_name="branches")
            branches = []
            for b in (data if isinstance(data, list) else []):
                branches.append({
                    'name': b.get('name'),
                    'commit_sha': b.get('commit', {}).get('sha', ''),
                    'protected': bool(b.get('protected', False))
                })
            return branches
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch branches for '{owner}/{repo}': {str(e)}")

    @classmethod
    def get_commits(cls, owner, repo, branch=None, per_page=30, max_commits=50):
        """
        Fetches repository commits with reusable pagination up to max_commits.
        """
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/commits"
        commits = []
        page = 1
        per_page = min(per_page, 100)

        try:
            while len(commits) < max_commits:
                limit = min(per_page, max_commits - len(commits))
                params = {'per_page': limit, 'page': page}
                if branch:
                    params['sha'] = branch

                resp = requests.get(url, headers=cls.get_headers(), params=params, timeout=12)
                data = cls._handle_response(resp, resource_name="commits")

                if not data or not isinstance(data, list):
                    break

                for item in data:
                    commit_info = item.get('commit', {})
                    author_info = commit_info.get('author') or {}
                    committer_info = commit_info.get('committer') or {}

                    commits.append({
                        'commit_sha': item.get('sha', ''),
                        'author_name': author_info.get('name') or item.get('author', {}).get('login') or 'Developer',
                        'author_email': author_info.get('email') or '',
                        'commit_message': commit_info.get('message', ''),
                        'commit_date': author_info.get('date') or committer_info.get('date'),
                        'commit_url': item.get('html_url') or f"https://github.com/{owner}/{repo}/commit/{item.get('sha')}"
                    })

                    if len(commits) >= max_commits:
                        break

                if len(data) < limit:
                    break
                page += 1

            return commits
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch commits for '{owner}/{repo}': {str(e)}")

    @classmethod
    def get_pull_requests(cls, owner, repo, state='all', per_page=30, max_prs=50):
        """
        Fetches pull requests with reusable pagination up to max_prs.
        """
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/pulls"
        prs = []
        page = 1
        per_page = min(per_page, 100)

        try:
            while len(prs) < max_prs:
                limit = min(per_page, max_prs - len(prs))
                params = {'state': state, 'per_page': limit, 'page': page}

                resp = requests.get(url, headers=cls.get_headers(), params=params, timeout=12)
                data = cls._handle_response(resp, resource_name="pull requests")

                if not data or not isinstance(data, list):
                    break

                for item in data:
                    merged_at = item.get('merged_at')
                    closed_at = item.get('closed_at')
                    pr_state = 'merged' if merged_at else item.get('state', 'open')

                    prs.append({
                        'github_pr_id': item.get('id'),
                        'pr_number': item.get('number'),
                        'title': item.get('title', ''),
                        'author': item.get('user', {}).get('login') or 'Contributor',
                        'state': pr_state,
                        'source_branch': item.get('head', {}).get('ref') or 'feature',
                        'target_branch': item.get('base', {}).get('ref') or 'main',
                        'created_at': item.get('created_at'),
                        'updated_at': item.get('updated_at'),
                        'merged_at': merged_at,
                        'closed_at': closed_at,
                        'review_status': 'MERGED' if merged_at else ('CLOSED' if pr_state == 'closed' else 'OPEN')
                    })

                    if len(prs) >= max_prs:
                        break

                if len(data) < limit:
                    break
                page += 1

            return prs
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch pull requests for '{owner}/{repo}': {str(e)}")

    @classmethod
    def get_contributors(cls, owner, repo, per_page=30, max_contributors=50):
        """
        Fetches contributors with reusable pagination up to max_contributors.
        """
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/contributors"
        contributors = []
        page = 1
        per_page = min(per_page, 100)

        try:
            while len(contributors) < max_contributors:
                limit = min(per_page, max_contributors - len(contributors))
                params = {'per_page': limit, 'page': page}

                resp = requests.get(url, headers=cls.get_headers(), params=params, timeout=12)
                data = cls._handle_response(resp, resource_name="contributors")

                if not data or not isinstance(data, list):
                    break

                for item in data:
                    contributors.append({
                        'github_user_id': str(item.get('id', '')),
                        'username': item.get('login', 'Developer'),
                        'display_name': item.get('login', 'Developer'),
                        'contributions': item.get('contributions', 0),
                        'profile_url': item.get('html_url') or f"https://github.com/{item.get('login')}",
                        'avatar_url': item.get('avatar_url') or ''
                    })

                    if len(contributors) >= max_contributors:
                        break

                if len(data) < limit:
                    break
                page += 1

            return contributors
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch contributors for '{owner}/{repo}': {str(e)}")

    @classmethod
    def get_repository_tree(cls, owner, repo, branch=None):
        """
        Retrieves repository Git tree using /git/trees/{branch}?recursive=1.
        Filters source-code files, calculates language distribution,
        and excludes .git, node_modules, build artifacts, and virtual environments.
        """
        ref = branch or 'main'
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/git/trees/{ref}?recursive=1"

        try:
            resp = requests.get(url, headers=cls.get_headers(), timeout=15)
            # If main failed with 404, try master
            if resp.status_code == 404 and (not branch or branch == 'main'):
                ref = 'master'
                url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/git/trees/{ref}?recursive=1"
                resp = requests.get(url, headers=cls.get_headers(), timeout=15)

            data = cls._handle_response(resp, resource_name="repository tree")
            tree_nodes = data.get('tree', [])

            total_files = 0
            source_files = []
            language_counts = {}

            for node in tree_nodes:
                if node.get('type') != 'blob':
                    continue

                path = node.get('path', '')
                total_files += 1

                # Filter ignored paths and files
                if any(path.startswith(prefix) for prefix in cls.IGNORE_PREFIXES):
                    continue
                filename = os.path.basename(path)
                if filename in cls.IGNORE_FILES:
                    continue

                # Identify language by extension
                ext = os.path.splitext(path)[1].lower()
                if ext in cls.LANGUAGE_EXTENSIONS:
                    lang = cls.LANGUAGE_EXTENSIONS[ext]
                    language_counts[lang] = language_counts.get(lang, 0) + 1
                    source_files.append({
                        'path': path,
                        'size': node.get('size', 0),
                        'language': lang,
                        'sha': node.get('sha')
                    })

            # Calculate language breakdown percentage
            total_source = len(source_files)
            language_breakdown = {}
            for lang, count in sorted(language_counts.items(), key=lambda x: x[1], reverse=True):
                percentage = round((count / total_source) * 100, 1) if total_source > 0 else 0
                language_breakdown[lang] = {
                    'files': count,
                    'percentage': percentage
                }

            return {
                'branch': ref,
                'total_files_scanned': total_files,
                'source_code_files_count': total_source,
                'language_breakdown': language_breakdown,
                'source_files': source_files[:100]  # Cap sample files returned to prevent payload bloat
            }
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch repository tree for '{owner}/{repo}': {str(e)}")

    @classmethod
    def get_file_content(cls, owner, repo, path, branch=None):
        """Fetches and decodes the raw text content of a repository file."""
        url = f"{cls.get_api_base_url()}/repos/{owner}/{repo}/contents/{path}"
        params = {}
        if branch:
            params['ref'] = branch

        try:
            resp = requests.get(url, headers=cls.get_headers(), params=params, timeout=12)
            data = cls._handle_response(resp, resource_name=f"file '{path}'")
            content_encoded = data.get('content', '')
            encoding = data.get('encoding', 'base64')

            if encoding == 'base64' and content_encoded:
                return base64.b64decode(content_encoded).decode('utf-8', errors='replace')
            return content_encoded
        except requests.exceptions.RequestException as e:
            raise GitHubNetworkError(f"Failed to fetch file content for '{path}': {str(e)}")
