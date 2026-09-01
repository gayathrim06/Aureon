import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Toast } from '../components/common/Toast';
import { Unauthorized403 } from '../components/common/Unauthorized403';
import { HomePage } from './HomePage';
import { Login } from './Login';
import { Projects } from './Projects';

// ─── Admin Role Pages (13 total) ─────────────────
import { AdminDashboard } from '../roles/admin/AdminDashboard';
import { UserManagement } from '../roles/admin/UserManagement';
import { AuditLogsView } from '../roles/admin/AuditLogsView';
import { RolesPermissions } from '../roles/admin/RolesPermissions';
import { OrganizationView } from '../roles/admin/OrganizationView';
import { TeamsView } from '../roles/admin/TeamsView';
import { AdminProjectsView } from '../roles/admin/AdminProjectsView';
import { RepositoriesHub } from '../roles/admin/RepositoriesHub';
import { SonarQubeAdmin } from '../roles/admin/SonarQubeAdmin';
import { SystemLogsView } from '../roles/admin/SystemLogsView';
import { ComplianceReports } from '../roles/admin/ComplianceReports';
import { NotificationsView } from '../roles/admin/NotificationsView';
import { PlatformSettings } from '../roles/admin/PlatformSettings';

// ─── PM Role Pages (11 total) ────────────────────
import { PmDashboard } from '../roles/pm/PmDashboard';
import { ProjectManagement } from '../roles/pm/ProjectManagement';
import { SprintPlanner } from '../roles/pm/SprintPlanner';
import { TaskBreakdown } from '../roles/pm/TaskBreakdown';
import { MilestoneTracker } from '../roles/pm/MilestoneTracker';
import { TeamWorkload } from '../roles/pm/TeamWorkload';
import { PmRepositoryView } from '../roles/pm/PmRepositoryView';
import { AiHealthInsights } from '../roles/pm/AiHealthInsights';
import { DeliveryReports } from '../roles/pm/DeliveryReports';
import { ReleaseCalendar } from '../roles/pm/ReleaseCalendar';
import { PmNotifications } from '../roles/pm/PmNotifications';

// ─── Team Lead Role Pages (9 total) ──────────────
import { LeadDashboard } from '../roles/lead/LeadDashboard';
import { LeadAssignedProjects } from '../roles/lead/LeadAssignedProjects';
import { LeadSprintBoard } from '../roles/lead/LeadSprintBoard';
import { LeadTaskAllocation } from '../roles/lead/LeadTaskAllocation';
import { DeveloperRoster } from '../roles/lead/DeveloperRoster';
import { LeadRepositoryView } from '../roles/lead/LeadRepositoryView';
import { CodeQualityHub } from '../roles/lead/CodeQualityHub';
import { LeadProjectHealth } from '../roles/lead/LeadProjectHealth';
import { LeadReports } from '../roles/lead/LeadReports';

// ─── Developer Role Pages (8 total) ──────────────
import { DevDashboard } from '../roles/dev/DevDashboard';
import { MyTasksKanban } from '../roles/dev/MyTasksKanban';
import { DevSprintView } from '../roles/dev/DevSprintView';
import { DevRepositoryView } from '../roles/dev/DevRepositoryView';
import { DevPullRequests } from '../roles/dev/DevPullRequests';
import { DevCodeIssues } from '../roles/dev/DevCodeIssues';
import { DevProfile } from '../roles/dev/DevProfile';
import { DevNotifications } from '../roles/dev/DevNotifications';

// ─── QA Engineer Role Pages (8 total) ────────────
import { QaDashboard } from '../roles/qa/QaDashboard';
import { BugTracker } from '../roles/qa/BugTracker';
import { QaTestSuites } from '../roles/qa/QaTestSuites';
import { TestCaseLibrary } from '../roles/qa/TestCaseLibrary';
import { QaProjectQuality } from '../roles/qa/QaProjectQuality';
import { QaRepositoryStatus } from '../roles/qa/QaRepositoryStatus';
import { QaTestReports } from '../roles/qa/QaTestReports';
import { UserProfile } from '../components/common/UserProfile';
import { QaProfile } from '../roles/qa/QaProfile';
import { ForceChangePasswordModal } from '../components/common/ForceChangePasswordModal';

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("View Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">!</div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Workspace Module Render Error</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">An unexpected component error occurred while rendering this module view.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); this.props.onReset && this.props.onReset(); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Return to Main Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppRouter = () => {
  const { user } = useAuth();
  const [viewState, setViewState] = useState('landing'); // 'landing', 'login'
  
  // Extract initial active tab from URL hash if present
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) return 'Dashboard';
    return hash.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromHash() || 'Dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => setToast(null), 4000);
  };

  const navigateTab = (newTab) => {
    if (!newTab) return;
    setActiveTab(newTab);
    const hash = `#${newTab.toLowerCase()}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ isAureonApp: true, viewState, activeTab: newTab }, '', hash);
    }
  };

  const navigateViewState = (newViewState) => {
    if (newViewState === viewState) return;
    setViewState(newViewState);
    const targetUrl = newViewState === 'landing' ? window.location.pathname : '#login';
    window.history.pushState({ isAureonApp: true, viewState: newViewState, activeTab }, '', targetUrl);
  };

  React.useEffect(() => {
    const currentHash = window.location.hash || `#${activeTab.toLowerCase()}`;
    if (!window.history.state || !window.history.state.isAureonApp) {
      window.history.replaceState({ isAureonApp: true, viewState, activeTab }, '', currentHash);
    }

    const handlePopState = (event) => {
      if (event.state && event.state.isAureonApp) {
        if (event.state.viewState) setViewState(event.state.viewState);
        if (event.state.activeTab) setActiveTab(event.state.activeTab);
      } else {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) {
          const tabName = hash.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
          setActiveTab(tabName);
        } else if (user) {
          setActiveTab('Dashboard');
        } else {
          setViewState('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [user]);

  if (!user && viewState === 'landing') {
    return (
      <HomePage
        onNavigateLogin={() => navigateViewState('login')}
        onNavigateRegister={() => navigateViewState('login')}
      />
    );
  }

  if (!user) {
    return (
      <Login
        onNavigateHome={() => navigateViewState('landing')}
      />
    );
  }

  const getNormalizedRole = (u) => {
    if (!u) return 'ROLE_DEV';
    if (u.email && u.email.toLowerCase() === 'gopika@aureon.com') return 'ROLE_PM';
    const rawRole = (typeof u.role === 'string' ? u.role : u.role?.code || u.role_code || u.role_name || '').toUpperCase();
    const rawTitle = ((u.designation || u.title || '') + ' ' + rawRole).toUpperCase();

    if (rawTitle.includes('PM') || rawTitle.includes('PROJECT MANAGER') || rawTitle.includes('MANAGER')) return 'ROLE_PM';
    if (rawTitle.includes('ADMIN')) return 'ROLE_ADMIN';
    if (rawTitle.includes('LEAD')) return 'ROLE_LEAD';
    if (rawTitle.includes('QA')) return 'ROLE_QA';
    return 'ROLE_DEV';
  };

  const renderRoleContent = () => {
    const role = getNormalizedRole(user);

    if (role === 'ROLE_ADMIN') {
      switch (activeTab) {
        case 'Dashboard': return <AdminDashboard onNavigate={navigateTab} />;
        case 'Users': return <UserManagement onShowToast={showToast} />;
        case 'AuditLogs': return <AuditLogsView />;
        case 'RolesPermissions': return <RolesPermissions />;
        case 'Organizations': return <OrganizationView />;
        case 'Teams': return <TeamsView />;
        case 'Projects': return <AdminProjectsView />;
        case 'Repositories': return <RepositoriesHub />;
        case 'SonarQube': return <SonarQubeAdmin />;
        case 'SystemLogs': return <SystemLogsView />;
        case 'Reports': return <ComplianceReports />;
        case 'Notifications': return <NotificationsView />;
        case 'Profile': return <UserProfile />;
        case 'Settings': return <PlatformSettings onShowToast={showToast} />;
        default: return <AdminDashboard onNavigate={navigateTab} />;
      }
    }

    if (role === 'ROLE_PM') {
      switch (activeTab) {
        case 'Dashboard': return <PmDashboard onNavigate={navigateTab} />;
        case 'Projects': return <Projects />;
        case 'Sprints': return <SprintPlanner onShowToast={showToast} />;
        case 'Tasks': return <TaskBreakdown />;
        case 'Milestones': return <MilestoneTracker />;
        case 'TeamMembers': return <TeamWorkload />;
        case 'Repository': return <PmRepositoryView />;
        case 'ProjectHealth': return <AiHealthInsights />;
        case 'Reports': return <DeliveryReports />;
        case 'Calendar': return <ReleaseCalendar />;
        case 'Notifications': return <PmNotifications />;
        case 'Profile': return <UserProfile />;
        default: return <PmDashboard onNavigate={navigateTab} />;
      }
    }

    if (role === 'ROLE_LEAD') {
      switch (activeTab) {
        case 'Dashboard': return <LeadDashboard onNavigate={navigateTab} />;
        case 'AssignedProjects': return <LeadAssignedProjects />;
        case 'SprintBoard': return <LeadSprintBoard onShowToast={showToast} />;
        case 'Tasks': return <LeadTaskAllocation onShowToast={showToast} />;
        case 'Developers': return <DeveloperRoster onShowToast={showToast} />;
        case 'Repository': return <LeadRepositoryView />;
        case 'CodeQuality': return <CodeQualityHub />;
        case 'ProjectHealth': return <LeadProjectHealth />;
        case 'Reports': return <LeadReports />;
        case 'Profile': return <UserProfile />;
        default: return <LeadDashboard onNavigate={navigateTab} />;
      }
    }

    if (role === 'ROLE_DEV') {
      switch (activeTab) {
        case 'Dashboard': return <DevDashboard onNavigate={navigateTab} />;
        case 'MyTasks': return <MyTasksKanban onShowToast={showToast} />;
        case 'Sprint': return <DevSprintView />;
        case 'Repository': return <DevRepositoryView />;
        case 'PullRequests': return <DevPullRequests />;
        case 'CodeIssues': return <DevCodeIssues />;
        case 'Profile': return <UserProfile />;
        case 'Notifications': return <DevNotifications />;
        default: return <DevDashboard onNavigate={navigateTab} />;
      }
    }

    if (role === 'ROLE_QA') {
      switch (activeTab) {
        case 'Dashboard': return <QaDashboard onNavigate={navigateTab} />;
        case 'BugTracker': return <BugTracker onShowToast={showToast} />;
        case 'TestSuites': return <QaTestSuites />;
        case 'TestCases': return <TestCaseLibrary onShowToast={showToast} />;
        case 'Projects': return <QaProjectQuality />;
        case 'Repository': return <QaRepositoryStatus />;
        case 'Reports': return <QaTestReports />;
        case 'Profile': return <UserProfile />;
        default: return <QaDashboard onNavigate={navigateTab} />;
      }
    }

    return <Unauthorized403 onBack={() => navigateTab('Dashboard')} />;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar activeTab={activeTab} onSelectTab={navigateTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentTab={activeTab} onSelectTab={navigateTab} onNavigateHome={() => navigateViewState('landing')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <ViewErrorBoundary onReset={() => navigateTab('Dashboard')}>
            {renderRoleContent()}
          </ViewErrorBoundary>
        </main>
      </div>
      <ForceChangePasswordModal
        isOpen={Boolean(user && user.must_change_password)}
        onPasswordChanged={() => {}}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};


