import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { initialUsers, developerMetrics } from '../../services/mockData';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { User, Mail, Shield, GitCommit, CheckSquare, Code2, Clock, Activity, Edit3, Plus, X, Award, Briefcase, Building } from 'lucide-react';

export const DevProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form state
  const [editTitle, setEditTitle] = useState(user?.designation || user?.title || 'Software Developer');
  const [editDepartment, setEditDepartment] = useState(user?.department || 'Engineering');
  const [skillsList, setSkillsList] = useState(user?.skills || ['React.js', 'Django REST', 'Python', 'Tailwind CSS', 'PostgreSQL']);
  const [newSkillInput, setNewSkillInput] = useState('');

  const fallbackData = initialUsers.find(u => u.role === 'ROLE_DEV') || initialUsers[3];
  const userData = {
    name: user?.name || user?.full_name || fallbackData.name,
    email: user?.email || fallbackData.email,
    role: user?.role || fallbackData.role,
    department: user?.department || fallbackData.department || 'Engineering',
    title: user?.designation || user?.title || fallbackData.title || 'Software Developer',
    avatar: user?.avatar || user?.avatar_url || user?.profile_image || fallbackData.avatar,
    skills: user?.skills || skillsList
  };
  const metrics = developerMetrics.find(d => d.name === userData.name) || developerMetrics[0];

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (!skillsList.includes(newSkillInput.trim())) {
      const updated = [...skillsList, newSkillInput.trim()];
      setSkillsList(updated);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillsList.filter(s => s !== skillToRemove);
    setSkillsList(updated);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      title: editTitle,
      designation: editTitle,
      department: editDepartment,
      skills: skillsList
    });
    setIsEditModalOpen(false);
  };

  const openEditModal = () => {
    setEditTitle(userData.title);
    setEditDepartment(userData.department);
    setSkillsList(userData.skills);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      <Breadcrumb activeTab="My Profile" />

      {/* Profile Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="flex items-center gap-5">
          <img src={userData.avatar} alt={userData.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{userData.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold border border-indigo-500/30">
                {userData.role}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 font-medium flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {userData.title}
              <span className="text-slate-500">•</span>
              <Building className="w-3.5 h-3.5 text-indigo-400" /> {userData.department}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" />{userData.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile & Skills
        </button>
      </div>

      {/* Skills Showcase Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Technical Skills & Competencies
          </h3>
          <button
            onClick={openEditModal}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            Manage Skills
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {userData.skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Commits', value: metrics.commits, icon: GitCommit, color: 'border-l-blue-500' },
          { label: 'Tasks Done', value: metrics.tasksCompleted, icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'PRs Created', value: metrics.prs, icon: Code2, color: 'border-l-purple-500' },
          { label: 'Reviews', value: metrics.codeReviews, icon: User, color: 'border-l-amber-500' },
          { label: 'Velocity', value: metrics.velocity + '%', icon: Activity, color: 'border-l-indigo-500' }
        ].map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-l-4 ${w.color} border-y border-r border-slate-200 dark:border-slate-800 shadow-sm`}>
              <Icon className="w-4 h-4 text-slate-400 mb-1" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">{w.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{w.label}</div>
            </div>
          );
        })}
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Details & Skills"
        subtitle="Update your Job Title, Department, and Technical Competencies"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Job Title / Designation"
            placeholder="e.g. Senior Full Stack Engineer"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
              Department
            </label>
            <select
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:outline-none"
            >
              <option value="Engineering">Engineering</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Product Delivery">Product Delivery</option>
              <option value="Platform & Infrastructure">Platform & Infrastructure</option>
              <option value="Executive Management">Executive Management</option>
            </select>
          </div>

          {/* Manage Skills List */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
              Additional Technical Skills
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Docker, GraphQL, Redis..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#111827] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:outline-none"
              />
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddSkill}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
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

