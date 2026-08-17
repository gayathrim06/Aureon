import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Plus, X, Award } from 'lucide-react';

export const Settings = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [title, setTitle] = useState(user?.designation || user?.title || 'Software Developer');
  const [department, setDepartment] = useState(user?.department || 'Engineering');
  const [skillsList, setSkillsList] = useState(user?.skills || ['React.js', 'Django REST', 'Python', 'Git']);
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (!skillsList.includes(newSkillInput.trim())) {
      setSkillsList(prev => [...prev, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      full_name: name,
      title,
      designation: title,
      department,
      skills: skillsList
    });
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Workspace & Security Settings</h2>
        <p className="text-xs text-[#94A3B8] mt-1">Manage team permissions, webhook secrets, and user profile details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={SettingsIcon}>Profile Information</CardTitle>
          <CardDescription>Update your job title, department, and technical competencies</CardDescription>
        </CardHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Work Email" value={user?.email || ''} disabled />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title / Designation"
              placeholder="e.g. Senior Full Stack Architect"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Product Delivery">Product Delivery</option>
                <option value="Platform & Infrastructure">Platform & Infrastructure</option>
                <option value="Executive Management">Executive Management</option>
              </select>
            </div>
          </div>

          {/* Manage Skills List */}
          <div className="space-y-2 pt-3 border-t border-[#334155]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1] flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Additional Technical Skills
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new skill (e.g. Docker, Kubernetes, GraphQL)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#111827] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:outline-none"
              />
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddSkill}>
                Add Skill
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {skillsList.map((sk, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-indigo-900/60 text-indigo-200 text-xs rounded-lg border border-indigo-700/50 flex items-center gap-2 font-medium"
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

          <div className="pt-4 border-t border-[#334155] flex justify-end">
            <Button type="submit" variant="primary" icon={Save}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

