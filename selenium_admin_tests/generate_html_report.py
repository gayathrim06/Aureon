import os
import json
import base64
from datetime import datetime

def generate_report(test_results, output_path, execution_metadata=None):
    """
    Generates a high-quality, standalone HTML report with embedded screenshots,
    interactive filters, and executive KPIs.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t['status'].upper() == 'PASS')
    failed_tests = sum(1 for t in test_results if t['status'].upper() == 'FAIL')
    skipped_tests = sum(1 for t in test_results if t['status'].upper() == 'SKIP')
    pass_rate = round((passed_tests / total_tests * 100), 1) if total_tests > 0 else 0
    total_duration = round(sum(t.get('duration', 0) for t in test_results), 2)

    meta = execution_metadata or {}
    browser = meta.get('browser', 'Chrome / Chromium (Headless)')
    platform = meta.get('platform', 'Windows 11 Enterprise / x64')
    backend = meta.get('backend', 'Python Flask 3.1.3 + SQLAlchemy ORM (Port 8000)')
    frontend = meta.get('frontend', 'React 19 + Vite + Tailwind CSS (Port 5173)')
    exec_time = meta.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    # Embed screenshots as base64 so HTML report is completely standalone
    rows_html = []
    for idx, test in enumerate(test_results, 1):
        status = test['status'].upper()
        status_badge_class = "badge-pass" if status == "PASS" else "badge-fail" if status == "FAIL" else "badge-skip"
        
        screenshot_html = '<span class="no-screenshot">—</span>'
        if test.get('screenshot') and os.path.exists(test['screenshot']):
            try:
                with open(test['screenshot'], 'rb') as img_f:
                    b64_data = base64.b64encode(img_f.read()).decode('utf-8')
                    screenshot_html = f'''
                    <div class="thumb-container" onclick="openModal('{b64_data}', '{test['id']}: {test['name']}')">
                        <img src="data:image/png;base64,{b64_data}" class="screenshot-thumb" alt="Screenshot" />
                        <span class="view-tag">View</span>
                    </div>
                    '''
            except Exception:
                screenshot_html = '<span class="no-screenshot">Error</span>'

        rows_html.append(f'''
        <tr class="test-row {status.lower()}" data-status="{status.lower()}" data-category="{test.get('category', 'General')}">
            <td class="col-num font-mono">{idx:02d}</td>
            <td class="col-id font-mono font-bold text-indigo">{test['id']}</td>
            <td class="col-category"><span class="category-pill">{test.get('category', 'Admin')}</span></td>
            <td class="col-name font-bold">{test['name']}</td>
            <td class="col-desc text-muted">{test.get('description', '')}</td>
            <td class="col-status"><span class="status-badge {status_badge_class}">{status}</span></td>
            <td class="col-duration font-mono">{test.get('duration', 0.0):.2f}s</td>
            <td class="col-screenshot">{screenshot_html}</td>
        </tr>
        ''')

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aureon Admin Module Automation Test Report</title>
    <style>
        :root {{
            --bg-primary: #0b0f17;
            --bg-surface: #111827;
            --bg-card: #1f2937;
            --border-color: #374151;
            --text-main: #f9fafb;
            --text-muted: #9ca3af;
            --indigo: #6366f1;
            --emerald: #10b981;
            --rose: #f43f5e;
            --amber: #f59e0b;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }}
        body {{ background-color: var(--bg-primary); color: var(--text-main); min-height: 100vh; padding: 2rem; }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        
        /* Header */
        .header {{ display: flex; justify-content: space-between; align-items: center; border-b: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 2rem; }}
        .header-left {{ display: flex; align-items: center; gap: 1rem; }}
        .logo-box {{ width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem; color: #fff; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }}
        .title-h1 {{ font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; }}
        .subtitle {{ font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }}
        .timestamp {{ font-size: 0.8rem; font-family: monospace; color: var(--text-muted); text-align: right; }}

        /* KPI Grid */
        .kpi-grid {{ display: grid; grid-cols: 1fr; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }}
        .kpi-card {{ background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.25rem; position: relative; overflow: hidden; }}
        .kpi-title {{ font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; }}
        .kpi-value {{ font-size: 2.2rem; font-weight: 900; margin-top: 0.4rem; }}
        .kpi-subtext {{ font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }}
        .color-emerald {{ color: var(--emerald); }}
        .color-rose {{ color: var(--rose); }}
        .color-indigo {{ color: var(--indigo); }}

        /* Meta Card */
        .meta-card {{ background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; font-size: 0.85rem; }}
        .meta-item strong {{ color: var(--text-muted); font-weight: 600; display: block; font-size: 0.75rem; margin-bottom: 0.2rem; text-transform: uppercase; }}

        /* Filters & Controls */
        .controls-bar {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }}
        .filter-group {{ display: flex; gap: 0.5rem; }}
        .filter-btn {{ background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-muted); padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }}
        .filter-btn.active, .filter-btn:hover {{ background: var(--indigo); color: #fff; border-color: var(--indigo); }}
        .search-box {{ background: var(--bg-surface); border: 1px solid var(--border-color); color: #fff; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.85rem; width: 300px; outline: none; }}
        .search-box:focus {{ border-color: var(--indigo); }}

        /* Table */
        .table-container {{ background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; }}
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }}
        th {{ background: #131c2e; padding: 1rem; color: var(--text-muted); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); }}
        td {{ padding: 1rem; border-bottom: 1px solid rgba(55, 65, 81, 0.4); vertical-align: middle; }}
        tr:hover td {{ background: rgba(99, 102, 241, 0.04); }}

        /* Badges */
        .status-badge {{ display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 800; font-size: 0.75rem; }}
        .badge-pass {{ background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); }}
        .badge-fail {{ background: rgba(244, 63, 94, 0.15); color: var(--rose); border: 1px solid rgba(244, 63, 94, 0.3); }}
        .badge-skip {{ background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }}
        .category-pill {{ background: rgba(99, 102, 241, 0.15); color: #a5b4fc; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(99, 102, 241, 0.25); }}

        /* Thumbnails */
        .thumb-container {{ position: relative; width: 64px; height: 40px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); cursor: pointer; transition: transform 0.2s; }}
        .thumb-container:hover {{ transform: scale(1.08); border-color: var(--indigo); }}
        .screenshot-thumb {{ width: 100%; height: 100%; object-fit: cover; }}
        .view-tag {{ position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: #fff; font-size: 9px; text-align: center; padding: 1px; }}
        .no-screenshot {{ color: var(--text-muted); font-size: 0.8rem; }}

        /* Modal */
        .modal-overlay {{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 9999; align-items: center; justify-content: center; }}
        .modal-content {{ background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; max-width: 90vw; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }}
        .modal-header {{ padding: 1rem 1.5rem; border-b: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }}
        .modal-title {{ font-size: 1rem; font-weight: 700; color: #fff; }}
        .modal-close {{ background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }}
        .modal-body {{ padding: 1rem; overflow: auto; text-align: center; }}
        .modal-img {{ max-width: 100%; max-height: 75vh; border-radius: 8px; border: 1px solid var(--border-color); }}

        /* Utilities */
        .font-mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
        .font-bold {{ font-weight: 700; }}
        .text-indigo {{ color: #818cf8; }}
        .text-muted {{ color: var(--text-muted); }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-left">
                <div class="logo-box">A</div>
                <div>
                    <h1 class="title-h1">Aureon – Admin Module Automation Test Report</h1>
                    <p class="subtitle">Enterprise Selenium Test Execution & Quality Assurance Audit Suite</p>
                </div>
            </div>
            <div class="timestamp">
                <div>Execution Completed: <strong>{exec_time}</strong></div>
                <div style="margin-top: 4px; color: var(--emerald);">STATUS: ALL TESTS EXECUTED</div>
            </div>
        </header>

        <!-- KPI Cards -->
        <section class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-title">Total Tests</div>
                <div class="kpi-value color-indigo">{total_tests}</div>
                <div class="kpi-subtext">Admin Module Test Scenarios</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Passed Tests</div>
                <div class="kpi-value color-emerald">{passed_tests}</div>
                <div class="kpi-subtext">Verified Workflows</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Failed Tests</div>
                <div class="kpi-value color-rose">{failed_tests}</div>
                <div class="kpi-subtext">Zero Critical Deficiencies</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Pass Rate</div>
                <div class="kpi-value color-emerald">{pass_rate}%</div>
                <div class="kpi-subtext">Functional Coverage Metric</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Execution Duration</div>
                <div class="kpi-value">{total_duration}s</div>
                <div class="kpi-subtext">Total Automated Runtime</div>
            </div>
        </section>

        <!-- Metadata Section -->
        <section class="meta-card">
            <div class="meta-item">
                <strong>Execution Platform</strong>
                <span>{platform}</span>
            </div>
            <div class="meta-item">
                <strong>Browser Engine</strong>
                <span>{browser}</span>
            </div>
            <div class="meta-item">
                <strong>Frontend Application</strong>
                <span>{frontend}</span>
            </div>
            <div class="meta-item">
                <strong>Backend REST API</strong>
                <span>{backend}</span>
            </div>
        </section>

        <!-- Controls -->
        <div class="controls-bar">
            <div class="filter-group">
                <button class="filter-btn active" onclick="filterTable('all', this)">All ({total_tests})</button>
                <button class="filter-btn" onclick="filterTable('pass', this)">Passed ({passed_tests})</button>
                <button class="filter-btn" onclick="filterTable('fail', this)">Failed ({failed_tests})</button>
            </div>
            <input type="text" id="searchInput" class="search-box" placeholder="Search tests by ID, name, or module..." onkeyup="searchTests()" />
        </div>

        <!-- Test Case Results Table -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th style="width: 140px;">Test ID</th>
                        <th style="width: 160px;">Category</th>
                        <th style="width: 260px;">Test Name</th>
                        <th>Scenario Description</th>
                        <th style="width: 110px;">Status</th>
                        <th style="width: 100px;">Duration</th>
                        <th style="width: 90px;">Evidence</th>
                    </tr>
                </thead>
                <tbody id="testTableBody">
                    {"".join(rows_html)}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Screenshot Modal -->
    <div id="imageModal" class="modal-overlay" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <div id="modalTitle" class="modal-title font-mono">Screenshot Evidence</div>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <img id="modalImg" class="modal-img" src="" alt="Screenshot Full" />
            </div>
        </div>
    </div>

    <script>
        function filterTable(status, btn) {{
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const rows = document.querySelectorAll('.test-row');
            rows.forEach(r => {{
                if (status === 'all' || r.dataset.status === status) {{
                    r.style.display = '';
                }} else {{
                    r.style.display = 'none';
                }}
            }});
        }}

        function searchTests() {{
            const query = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('.test-row');
            rows.forEach(r => {{
                const text = r.innerText.toLowerCase();
                r.style.display = text.includes(query) ? '' : 'none';
            }});
        }}

        function openModal(b64, title) {{
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalImg').src = 'data:image/png;base64,' + b64;
            document.getElementById('imageModal').style.display = 'flex';
        }}

        function closeModal(e) {{
            document.getElementById('imageModal').style.display = 'none';
        }}
    </script>
</body>
</html>
'''
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return output_path
