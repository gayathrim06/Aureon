import React, { useState } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { initialUsers, developerMetrics } from '../../services/mockData';
import {
  User, Mail, Shield, Briefcase, Building, Edit3, Plus, X, Award,
  Activity, CheckSquare, GitCommit, Code2, Bug, TestTube2, Layers, Server, Sparkles, CheckCircle2
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fallback defaults if user properties are omitted
  const role = user?.role || 'ROLE_ADMIN';
  const name = user?.name || user?.full_name || 'Aureon Engineer';
  const email = user?.email || 'user@aureon.io';
  const department = user?.department || (
    role === 'ROLE_ADMIN' ? 'System Administration' :
    role === 'ROLE_PM' ? 'Product & Project Management' :
    role === 'ROLE_LEAD' ? 'Engineering Lead' :
    role === 'ROLE_QA' ? 'Quality Assurance' : 'Software Engineering'
  );
  const title = user?.designation || user?.title || (
    role === 'ROLE_ADMIN' ? 'Platform Security & System Administrator' :
    role === 'ROLE_PM' ? 'Senior Technical Program Manager' :
    role === 'ROLE_LEAD' ? 'Full Stack Engineering Lead' :
    role === 'ROLE_QA' ? 'Senior QA Automation Engineer' : 'Full Stack Developer'
  );
  const avatar = user?.avatar || user?.avatar_url || user?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const gender = user?.gender || 'PREFER_NOT_TO_SAY';
  const skills = user?.skills || ['React.js', 'Django REST Framework', 'Python', 'PostgreSQL', 'Docker', 'Git', 'Agile Methodologies'];

  // Form State
  const [editName, setEditName] = useState(name);
  const [editTitle, setEditTitle] = useState(title);
  const [editDepartment, setEditDepartment] = useState(department);
  const [editGender, setEditGender] = useState(gender);
  const [skillsList, setSkillsList] = useState(skills);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(avatar);

  const openModal = () => {
    setEditName(name);
    setEditTitle(title);
    setEditDepartment(department);
    setEditGender(gender);
    setSkillsList(skills);
    setAvatarUrl(avatar);
    setIsEditModalOpen(true);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (!skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      full_name: editName,
      title: editTitle,
      designation: editTitle,
      department: editDepartment,
      gender: editGender,
      skills: skillsList,
      avatar: avatarUrl,
      avatar_url: avatarUrl
    });
    setIsEditModalOpen(false);
  };

  // Role-based stat metrics configuration
  const getRoleMetrics = () => {
    switch (role) {
      case 'ROLE_ADMIN':
        return [
          { label: 'System Uptime', value: '99.98%', icon: Server, color: 'border-l-emerald-500' },
          { label: 'Active Users', value: '142', icon: User, color: 'border-l-blue-500' },
          { label: 'Audit Logs', value: '1,280', icon: Activity, color: 'border-l-indigo-500' },
          { label: 'Security Level', value: 'ENTERPRISE', icon: Shield, color: 'border-l-amber-500' }
        ];
      case 'ROLE_PM':
        return [
          { label: 'Active Projects', value: '8', icon: Layers, color: 'border-l-indigo-500' },
          { label: 'Sprint Progress', value: '84%', icon: Activity, color: 'border-l-emerald-500' },
          { label: 'Milestones Met', value: '24', icon: Award, color: 'border-l-blue-500' },
          { label: 'Team Capacity', value: '92%', icon: User, color: 'border-l-purple-500' }
        ];
      case 'ROLE_LEAD':
        return [
          { label: 'Team Velocity', value: '48 pts', icon: Activity, color: 'border-l-emerald-500' },
          { label: 'Code Quality', value: 'A Grade', icon: Code2, color: 'border-l-blue-500' },
          { label: 'Code Reviews', value: '34', icon: CheckSquare, color: 'border-l-purple-500' },
          { label: 'Active Sprints', value: '3', icon: Layers, color: 'border-l-amber-500' }
        ];
      case 'ROLE_QA':
        return [
          { label: 'Test Cases', value: '240', icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Bugs Logged', value: '18', icon: Bug, color: 'border-l-rose-500' },
          { label: 'Test Suites', value: '12', icon: TestTube2, color: 'border-l-blue-500' },
          { label: 'Pass Rate', value: '94%', icon: Activity, color: 'border-l-purple-500' }
        ];
      default:
        return [
          { label: 'Commits', value: '124', icon: GitCommit, color: 'border-l-blue-500' },
          { label: 'Tasks Done', value: '38', icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Pull Requests', value: '19', icon: Code2, color: 'border-l-purple-500' },
          { label: 'Code Reviews', value: '15', icon: User, color: 'border-l-amber-500' }
        ];
    }
  };

  const roleMetrics = getRoleMetrics();

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="My Profile" />

      {/* Profile Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center border-2 border-indigo-500/40 shadow-md ring-4 ring-indigo-500/20">
            {name ? name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold border border-indigo-500/30">
                {role.replace('ROLE_', '')}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 font-medium flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {title}
              <span className="text-slate-500">•</span>
              <Building className="w-3.5 h-3.5 text-indigo-400" /> {department}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {email}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Verified
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile & Preferences
        </button>
      </div>

      {/* Role Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {roleMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 ${m.color} border-y border-r border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow`}
            >
              <Icon className="w-4 h-4 text-slate-400 mb-1" />
              <div className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Technical Skills & Competencies Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Technical Skills & Domain Competencies
          </h3>
          <button
            onClick={openModal}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            Manage Skills
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {skillsList.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Security & Access Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> RBAC Security & Authorization
          </h3>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Assigned Role</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Authentication Method</span>
              <span>OAuth2 JWT Session</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Audit Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">COMPLIANT</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Active Workspace Configuration
          </h3>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Department</span>
              <span>{department}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Gender Preference</span>
              <span>{gender.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Notification Preferences</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">ENABLED</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile Details"
        subtitle="Update your full name, job title, department, avatar image, and skills"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Sarah Connor"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="Job Title / Designation"
            placeholder="e.g. Senior Software Architect"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Department
              </label>
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:outline-none"
              >
                <option value="System Administration">System Administration</option>
                <option value="Product & Project Management">Product & Project Management</option>
                <option value="Engineering Lead">Engineering Lead</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Gender
              </label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer Not to Say</option>
              </select>
            </div>
          </div>

          {/* Manage Skills List */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
              Technical Skills & Competencies
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Docker, GraphQL, PyTest..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#111827] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:outline-none"
              />
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddSkill}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 max-h-32 overflow-y-auto">
              {skillsList.map((sk, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-indigo-900/60 text-indigo-200 text-xs rounded-lg border border-indigo-700/50 flex items-center gap-1.5"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/60">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
