import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  MoreVertical,
  Activity,
  ShieldCheck,
  FileBarChart,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  mockMetrics,
  mockProjects,
  mockTeamBreakdown,
  mockTaskCounts,
  mockRecentTasks,
  mockRepositories,
  mockCodeQuality,
  mockActivities,
  mockReportsList
} from '../mock/mockData';
import { MetricCards } from '../components/dashboard/MetricCards';
import { ProjectHealthCard } from '../components/dashboard/ProjectHealthCard';
import { TeamOverview } from '../components/dashboard/TeamOverview';
import { TaskOverview } from '../components/dashboard/TaskOverview';
import { RepositorySection } from '../components/dashboard/RepositorySection';
import { CodeQualitySection } from '../components/dashboard/CodeQualitySection';
import { RecentActivities } from '../components/dashboard/RecentActivities';
import { ReportsSection } from '../components/dashboard/ReportsSection';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Table, TableRow, TableCell } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ProgressBar } from '../components/common/ProgressBar';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';

export const Dashboard = () => {
  const { user, showToast } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Form state for creating a new project
  const [newProjName, setNewProjName] = useState('');
  const [newProjPriority, setNewProjPriority] = useState('High');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Filter projects
  const filteredProjects = mockProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjName) return;
    showToast(`Project "${newProjName}" initialized successfully!`, 'success');
    setIsNewProjectModalOpen(false);
    setNewProjName('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* WELCOME SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#1F2937] via-[#111827] to-[#0F172A] border border-[#334155] rounded-[18px] shadow-xl"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
              Good Morning, {user?.name ? user.name.split(' ')[0] : 'Gayathri'}
            </h2>
            <Badge variant="brand" size="sm" dot>Workspace Active</Badge>
          </div>
          <p className="text-xs text-[#CBD5E1]">
            Monitor your software engineering projects, code health, and repositories from one centralized platform.
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-[#94A3B8]">
            <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{currentDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => showToast('Exporting workspace summary PDF...', 'info')}
          >
            Export Summary
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            New Project
          </Button>
        </div>
      </motion.div>

      {/* METRIC CARDS (8 CARDS) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8]">Platform Performance Metrics</h3>
          <span className="text-xs text-[#38BDF8] font-semibold">Updated 2m ago</span>
        </div>
        <MetricCards metrics={mockMetrics} />
      </section>

      {/* PROJECT HEALTH & CODE QUALITY SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectHealthCard healthScore={94} />
        <CodeQualitySection quality={mockCodeQuality} />
      </div>

      {/* PROJECT TABLE SECTION */}
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle icon={FolderKanban}>Active Software Engineering Projects</CardTitle>
            <CardDescription>Comprehensive project portfolio status & health compliance</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#111827] text-xs text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-[12px] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-[#111827] text-xs text-[#CBD5E1] border border-[#334155] rounded-[12px] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </CardHeader>

        <Table headers={['Project ID & Name', 'Manager', 'Status', 'Priority', 'Progress', 'Health Score', 'Deadline', 'Actions']}>
          {filteredProjects.map((proj) => (
            <TableRow key={proj.id}>
              <TableCell>
                <div>
                  <div className="font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <span className="text-xs font-mono text-[#38BDF8]">{proj.id}</span>
                    <span>{proj.name}</span>
                  </div>
                  <span className="text-[11px] text-[#94A3B8]">{proj.reposCount} Repositories connected</span>
                </div>
              </TableCell>

              <TableCell>{proj.manager}</TableCell>

              <TableCell>
                <Badge
                  variant={proj.status === 'Completed' ? 'success' : proj.status === 'Active' ? 'brand' : 'warning'}
                  size="sm"
                  dot
                >
                  {proj.status}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={proj.priority === 'Urgent' ? 'error' : proj.priority === 'High' ? 'warning' : 'neutral'}
                  size="sm"
                >
                  {proj.priority}
                </Badge>
              </TableCell>

              <TableCell className="w-36">
                <ProgressBar progress={proj.progress} showPercentage={true} height="h-1.5" />
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#111827] border border-[#2563EB] text-[#2563EB] font-bold text-[11px] flex items-center justify-center">
                    {proj.health}
                  </div>
                  <span className="text-xs text-[#10B981] font-semibold">Optimal</span>
                </div>
              </TableCell>

              <TableCell className="text-xs text-[#94A3B8]">{proj.deadline}</TableCell>

              <TableCell>
                <button
                  onClick={() => showToast(`Opening details for ${proj.id}...`, 'info')}
                  className="p-1.5 hover:bg-[#111827] text-[#94A3B8] hover:text-white rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={1}
          totalItems={filteredProjects.length}
          itemsPerPage={10}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {/* TEAM OVERVIEW & TASK OVERVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamOverview teamBreakdown={mockTeamBreakdown} />
        <TaskOverview taskCounts={mockTaskCounts} recentTasks={mockRecentTasks} />
      </div>

      {/* REPOSITORIES & RECENT ACTIVITIES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RepositorySection repositories={mockRepositories} />
        <RecentActivities activities={mockActivities} />
      </div>

      {/* REPORTS MANAGEMENT */}
      <ReportsSection reports={mockReportsList} />

      {/* CREATE NEW PROJECT MODAL */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Initialize New Engineering Project"
        subtitle="Create a new software repository container with static analysis triggers"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g., Aureon Microservices Mesh"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
              Priority Level
            </label>
            <select
              value={newProjPriority}
              onChange={(e) => setNewProjPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:outline-none"
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsNewProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
