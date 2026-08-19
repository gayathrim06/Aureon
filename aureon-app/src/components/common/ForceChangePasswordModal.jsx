import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForceChangePasswordModal = ({ isOpen, onPasswordChanged }) => {
  const { user, updateProfile, showToast } = useAuth();
  const [oldPassword, setOldPassword] = useState('Aureon@123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === 'Aureon@123') {
      setErrorMsg('Please choose a unique password different from the default initial password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showToast('Password updated successfully! Welcome to your Aureon workspace.', 'success');
        updateProfile({ must_change_password: false });
        onPasswordChanged && onPasswordChanged();
      } else {
        setErrorMsg(data.message || 'Password update failed. Please check your current password.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Initial Password Change Required</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">First-time login setup for security governance</p>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Default Password Detected
          </p>
          <p className="text-[11px]">
            Your administrator created your account with the initial password <span className="font-mono font-bold bg-amber-500/20 px-1 py-0.5 rounded">Aureon@123</span>. Please create your own unique password to proceed.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Initial Password *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 font-mono focus:outline-none focus:border-indigo-500"
              placeholder="Aureon@123"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Secure Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              placeholder="Repeat new password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Updating Password...' : 'Save New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
