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
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="My Profile" />

      {/* Theme-Aware Profile Header Card */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/20">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 text-white font-black text-3xl flex items-center justify-center border-2 border-white/30 shadow-md ring-4 ring-white/10">
            {userData.name ? userData.name.charAt(0).toUpperCase() : 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{userData.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold border border-white/30">
                {userData.role}
              </span>
            </div>
            <p className="text-xs banner-subtext mt-1 font-medium flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-white/80" /> {userData.title}
              <span className="text-white/40">•</span>
              <Building className="w-3.5 h-3.5 text-white/80" /> {userData.department}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-[11px] text-white/90">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-white/80" />{userData.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-md transition-all hover:scale-105 shrink-0 relative z-10"
        >
          <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Profile & Skills
        </button>
      </div>

      {/* Skills Showcase Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Technical Skills & Competencies
          </h3>
          <button
            onClick={openEditModal}
            className="text-xs text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] hover:underline font-semibold flex items-center gap-1"
          >
            Manage Skills
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsList.map((skill, index) => (
            <span key={index} className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-700 dark:text-indigo-300 warm:text-[#342314] text-xs font-bold border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e]">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
