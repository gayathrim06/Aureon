import React, { useState, useEffect } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import {
  User, Mail, Shield, Briefcase, Building, Edit3, Plus, X, Award, Phone, Calendar, Key, Hash,
  Activity, CheckSquare, GitCommit, Code2, Bug, TestTube2, Layers, Server, Sparkles, CheckCircle2, Save
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateProfile, showToast } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fallback defaults if user properties are omitted
  const role = user?.role || user?.role_name || 'ROLE_DEV';
  const name = user?.name || user?.full_name || 'Aureon User';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : '');
  const email = user?.email || '';
  const phone = user?.phone || '';
  const employeeId = user?.employee_id || user?.employeeId || '';
  const department = user?.department || 'Engineering';
  const title = user?.designation || user?.title || 'Team Member';
  const gender = user?.gender || 'PREFER_NOT_TO_SAY';
  const dob = user?.date_of_birth || user?.dob || '';
  const petName = user?.pet_name || user?.petName || '';
  const schoolFriendName = user?.school_friend_name || user?.best_friend_name || user?.bestFriendName || '';
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  const [stats, setStats] = useState({
    commits: 0,
    tasks_done: 0,
    pull_requests: 0,
    code_reviews: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = sessionStorage.getItem('aureon_jwt_access_token');
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/users/me/stats', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        // Zero baseline fallback
      }
    };
    fetchStats();
  }, [user]);

  // Form State for Editing User Details
  const [editName, setEditName] = useState(name);
  const [editUsername, setEditUsername] = useState(username);
  const [editPhone, setEditPhone] = useState(phone);
  const [editEmployeeId, setEditEmployeeId] = useState(employeeId);
  const [editTitle, setEditTitle] = useState(title);
  const [editDepartment, setEditDepartment] = useState(department);
  const [editGender, setEditGender] = useState(gender);
  const [editDob, setEditDob] = useState(dob);
  const [editPetName, setEditPetName] = useState(petName);
  const [editSchoolFriendName, setEditSchoolFriendName] = useState(schoolFriendName);
  const [skillsList, setSkillsList] = useState(skills);
  const [newSkillInput, setNewSkillInput] = useState('');

  const openModal = () => {
    setEditName(name);
    setEditUsername(username);
    setEditPhone(phone);
    setEditEmployeeId(employeeId);
    setEditTitle(title);
    setEditDepartment(department);
    setEditGender(gender);
    setEditDob(dob);
    setEditPetName(petName);
    setEditSchoolFriendName(schoolFriendName);
    setSkillsList(skills);
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

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    const payload = {
      name: editName,
      full_name: editName,
      username: editUsername,
      phone: editPhone,
      employee_id: editEmployeeId,
      designation: editTitle,
      title: editTitle,
      department: editDepartment,
      gender: editGender,
      date_of_birth: editDob,
      pet_name: editPetName,
      school_friend_name: editSchoolFriendName,
      best_friend_name: editSchoolFriendName,
      skills: skillsList
    };

    updateProfile(payload);

    const token = sessionStorage.getItem('aureon_jwt_access_token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Fallback
    }

    if (showToast) showToast('Account profile updated successfully!', 'success');
    setIsEditModalOpen(false);
  };

  const getRoleMetrics = () => {
    switch (role) {
      case 'ROLE_ADMIN':
        return [
          { label: 'System Health', value: '100%', icon: Server, color: 'border-l-emerald-500' },
          { label: 'Registered Users', value: '20', icon: User, color: 'border-l-blue-500' },
          { label: 'Audit Telemetry', value: 'ACTIVE', icon: Activity, color: 'border-l-indigo-500' },
          { label: 'Security Standard', value: 'BCNF + JWT', icon: Shield, color: 'border-l-amber-500' }
        ];
      case 'ROLE_PM':
        return [
          { label: 'Active Projects', value: '0', icon: Layers, color: 'border-l-indigo-500' },
          { label: 'Sprint Velocity', value: '0%', icon: Activity, color: 'border-l-emerald-500' },
          { label: 'Milestones', value: '0', icon: Award, color: 'border-l-blue-500' },
          { label: 'Team Allocation', value: 'Unassigned', icon: User, color: 'border-l-purple-500' }
        ];
      case 'ROLE_LEAD':
        return [
          { label: 'Team Velocity', value: '0 pts', icon: Activity, color: 'border-l-emerald-500' },
          { label: 'Code Quality', value: '100%', icon: Code2, color: 'border-l-blue-500' },
          { label: 'Code Reviews', value: '0', icon: CheckSquare, color: 'border-l-purple-500' },
          { label: 'Active Sprints', value: '0', icon: Layers, color: 'border-l-amber-500' }
        ];
      case 'ROLE_QA':
        return [
          { label: 'Test Cases', value: '0', icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Bugs Logged', value: '0', icon: Bug, color: 'border-l-rose-500' },
          { label: 'Test Suites', value: '0', icon: TestTube2, color: 'border-l-blue-500' },
          { label: 'Pass Rate', value: '100%', icon: Activity, color: 'border-l-purple-500' }
        ];
      default:
        return [
          { label: 'Commits', value: String(stats.commits || 0), icon: GitCommit, color: 'border-l-blue-500' },
          { label: 'Tasks Completed', value: String(stats.tasks_done || 0), icon: CheckSquare, color: 'border-l-emerald-500' },
          { label: 'Pull Requests', value: String(stats.pull_requests || 0), icon: Code2, color: 'border-l-purple-500' },
          { label: 'Code Reviews', value: String(stats.code_reviews || 0), icon: User, color: 'border-l-amber-500' }
        ];
    }
  };

  const roleMetrics = getRoleMetrics();

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <Breadcrumb activeTab="My Profile" />

      {/* Theme-Aware Header Banner */}
      <div className="relative p-6 rounded-2xl aureon-theme-banner overflow-hidden transition-all duration-300 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/20">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 text-white font-black text-3xl flex items-center justify-center border-2 border-white/30 shadow-md ring-4 ring-white/10">
            {name ? name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] uppercase font-bold border border-white/30">
                {role.replace('ROLE_', '')}
              </span>
            </div>
            <p className="text-xs banner-subtext mt-1 font-medium flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-white/80" /> {title}
              <span className="text-white/40">•</span>
              <Building className="w-3.5 h-3.5 text-white/80" /> {department}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px] text-white/90">
              {email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-white/80" /> {email}
                </span>
              )}
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-white/80" /> {phone}
                </span>
              )}
              {employeeId && (
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-white/80" /> ID: {employeeId}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Active & Verified
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-md transition-all hover:scale-105 shrink-0 relative z-10"
        >
          <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Profile Options
        </button>
      </div>

      {/* Role-Based Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`p-4 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border-l-4 ${m.color} border-y border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                <span className="text-xs font-semibold">{m.label}</span>
                <Icon className="w-4 h-4 text-slate-400 warm:text-[#69523c]" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] mt-2">{m.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Profile Column Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-indigo-500" /> Personal & Account Details
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Username</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-bold">{username || 'Unset'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Employee ID / Staff Code</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 warm:text-[#342314] font-bold">{employeeId || 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Contact Phone</span>
              <span className="text-slate-700 dark:text-slate-300 warm:text-[#342314]">{phone || 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Gender Preference</span>
              <span className="text-slate-700 dark:text-slate-300 warm:text-[#342314]">{gender.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Date of Birth</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 warm:text-[#342314]">{dob || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Security Recovery Details */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Key className="w-4 h-4 text-amber-500" /> Security Recovery Credentials
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Pet Name Answer</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 warm:text-[#342314]">{petName ? '•••••••• (Configured)' : <span className="text-amber-500">Not set</span>}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Best Friend Name Answer</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 warm:text-[#342314]">{schoolFriendName ? '•••••••• (Configured)' : <span className="text-amber-500">Not set</span>}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">MFA Status</span>
              <span className="text-slate-400">Disabled (Password Auth)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 warm:text-[#69523c]">Password Reset Verification</span>
              <span className="text-emerald-500 font-bold">READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Showcase Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white warm:text-[#342314] flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Technical Skills & Competencies
          </h3>
          <button
            onClick={openModal}
            className="text-xs text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] hover:underline font-semibold flex items-center gap-1"
          >
            Manage Skills
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsList && skillsList.length > 0 ? (
            skillsList.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-900 dark:text-indigo-200 warm:text-[#342314] text-xs font-extrabold border border-indigo-200 dark:border-indigo-800 warm:border-[#cbb68e] flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]" />
                <span className="text-indigo-900 dark:text-indigo-200 warm:text-[#342314] font-bold">{skill}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] font-semibold italic">
              No technical skills added yet. Click "Manage Skills" to add your skills.
            </span>
          )}
        </div>
      </div>

      {/* Edit Profile Modal with Sticky Footer Bar */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Account Profile Credentials"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" icon={Save} onClick={handleSaveProfile}>
              Save Account Profile
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Job Title / Designation" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            <Input label="Department" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+1 (555) 019-2834" />
            <Input label="Employee ID" value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} placeholder="EMP-1092" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Gender</label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-sans text-slate-900 dark:text-white warm:text-[#342314]"
              >
                <option value="PREFER_NOT_TO_SAY">Prefer Not to Say</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="NON_BINARY">Non-Binary</option>
              </select>
            </div>
            <Input label="Date of Birth" type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-indigo-600 warm:text-[#b45309] uppercase tracking-wider block">
              Security Recovery Verification
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pet Name" value={editPetName} onChange={(e) => setEditPetName(e.target.value)} placeholder="e.g. Buster" />
              <Input label="Best Friend's Name" value={editSchoolFriendName} onChange={(e) => setEditSchoolFriendName(e.target.value)} placeholder="e.g. Samuel" />
            </div>
          </div>

          {/* Manage Skills */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block font-bold">Technical Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new skill (e.g. React, Python, PostgreSQL)"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skillsList.map((skill, index) => (
                <span key={index} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] text-xs font-semibold flex items-center gap-1.5">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-rose-500 hover:text-rose-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
