import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Toast } from '../components/common/Toast';
import { Unauthorized403 } from '../components/common/Unauthorized403';
import { HomePage } from './HomePage';
import { Login } from './Login';

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
import { QaProfile } from '../roles/qa/QaProfile';

export const AppRouter = () => {
  const { user } = useAuth();
  const [viewState, setViewState] = useState('landing'); // 'landing', 'login'
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Unauthenticated: Show Public Home Page if on landing
  if (!user && viewState === 'landing') {
    return (
      <HomePage
        onNavigateLogin={() => setViewState('login')}
        onNavigateRegister={() => setViewState('login')}
      />
    );
  }

  // 2. Unauthenticated: Show Login Page if user clicked Sign In or logged out
  if (!user) {
    return (
      <Login
        onNavigateHome={() => setViewState('landing')}
      />
    );
  }

  // 3. Authenticated: Render user's specific role workspace
  const renderRoleContent = () => {
    const role = user.role;

    // ━━━ SYSTEM ADMIN ━━━
    if (role === 'ROLE_ADMIN') {
      switch (activeTab) {
        case 'Dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
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
        case 'Settings': return <PlatformSettings onShowToast={showToast} />;
        default: return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    // ━━━ PROJECT MANAGER ━━━
    if (role === 'ROLE_PM') {
      switch (activeTab) {
        case 'Dashboard': return <PmDashboard onNavigate={setActiveTab} />;
        case 'Projects': return <ProjectManagement onShowToast={showToast} />;
        case 'Sprints': return <SprintPlanner onShowToast={showToast} />;
        case 'Tasks': return <TaskBreakdown />;
        case 'Milestones': return <MilestoneTracker />;
        case 'TeamMembers': return <TeamWorkload />;
        case 'Repository': return <PmRepositoryView />;
        case 'ProjectHealth': return <AiHealthInsights />;
        case 'Reports': return <DeliveryReports />;
        case 'Calendar': return <ReleaseCalendar />;
        case 'Notifications': return <PmNotifications />;
        default: return <PmDashboard onNavigate={setActiveTab} />;
      }
    }

    // ━━━ TEAM LEAD ━━━
    if (role === 'ROLE_LEAD') {
      switch (activeTab) {
        case 'Dashboard': return <LeadDashboard onNavigate={setActiveTab} />;
        case 'AssignedProjects': return <LeadAssignedProjects />;
        case 'SprintBoard': return <LeadSprintBoard onShowToast={showToast} />;
        case 'Tasks': return <LeadTaskAllocation />;
        case 'Developers': return <DeveloperRoster />;
        case 'Repository': return <LeadRepositoryView />;
        case 'CodeQuality': return <CodeQualityHub />;
        case 'ProjectHealth': return <LeadProjectHealth />;
        case 'Reports': return <LeadReports />;
        default: return <LeadDashboard onNavigate={setActiveTab} />;
      }
    }

    // ━━━ DEVELOPER ━━━
    if (role === 'ROLE_DEV') {
      switch (activeTab) {
        case 'Dashboard': return <DevDashboard onNavigate={setActiveTab} />;
        case 'MyTasks': return <MyTasksKanban onShowToast={showToast} />;
        case 'Sprint': return <DevSprintView />;
        case 'Repository': return <DevRepositoryView />;
        case 'PullRequests': return <DevPullRequests />;
        case 'CodeIssues': return <DevCodeIssues />;
        case 'Profile': return <DevProfile />;
        case 'Notifications': return <DevNotifications />;
        default: return <DevDashboard onNavigate={setActiveTab} />;
      }
    }

    // ━━━ QA ENGINEER ━━━
    if (role === 'ROLE_QA') {
      switch (activeTab) {
        case 'Dashboard': return <QaDashboard onNavigate={setActiveTab} />;
        case 'BugTracker': return <BugTracker onShowToast={showToast} />;
        case 'TestSuites': return <QaTestSuites />;
        case 'TestCases': return <TestCaseLibrary onShowToast={showToast} />;
        case 'Projects': return <QaProjectQuality />;
        case 'Repository': return <QaRepositoryStatus />;
        case 'Reports': return <QaTestReports />;
        case 'Profile': return <QaProfile />;
        default: return <QaDashboard onNavigate={setActiveTab} />;
      }
    }

    return <Unauthorized403 onBack={() => setActiveTab('Dashboard')} />;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentTab={activeTab} onSelectTab={setActiveTab} onNavigateHome={() => setViewState('landing')} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderRoleContent()}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
