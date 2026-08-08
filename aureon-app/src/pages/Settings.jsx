import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Key, Bell, Save } from 'lucide-react';

export const Settings = () => {
  const { user, showToast } = useAuth();

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Workspace settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Workspace & Security Settings</h2>
        <p className="text-xs text-[#94A3B8] mt-1">Manage team permissions, webhook secrets, and user profile details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle icon={SettingsIcon}>Profile Information</CardTitle>
          <CardDescription>Update your engineering workspace profile credentials</CardDescription>
        </CardHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={user?.name || 'Gayathri Ramesh'} />
            <Input label="Work Email" defaultValue={user?.email || 'gayathri@aureon.engineering'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Engineering Role" defaultValue={user?.role || 'Project Manager'} disabled />
            <Input label="Department" defaultValue={user?.department || 'Platform Engineering'} />
          </div>

          <div className="pt-4 border-t border-[#334155] flex justify-end">
            <Button type="submit" variant="primary" icon={Save}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
