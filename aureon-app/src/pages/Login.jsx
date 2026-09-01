import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Key, Lock, AlertTriangle, ArrowRight, CheckCircle2, 
  UserCheck, Laptop, Layers, Bug, ArrowLeft, Info, UserPlus, HelpCircle, Calendar, User
} from 'lucide-react';

export const Login = ({ onNavigateHome }) => {
  const { login, isLocked } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', or 'forgot'
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Registration Form State
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ROLE_DEV',
    department: 'Engineering',
    designation: 'Full Stack Developer',
    dateOfBirth: '',
    bestFriendName: ''
  });

  // Forgot Password State
  const [forgotData, setForgotData] = useState({
    email: '',
    dateOfBirth: '',
    bestFriendName: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');

    if (!regData.fullName || !regData.email || !regData.password || !regData.confirmPassword) {
      setErrorMsg('Please fill in all required account fields.');
      return;
    }

    if (!regData.dateOfBirth && !regData.bestFriendName) {
      setErrorMsg('Please answer at least one security question (Date of Birth OR Best Friend Name) for account recovery.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regData.fullName,
          email: regData.email,
          password: regData.password,
          role: regData.role,
          department: regData.department,
          designation: regData.designation,
          dateOfBirth: regData.dateOfBirth,
          bestFriendName: regData.bestFriendName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccessMsg('Registration successful! Please sign in using your credentials.');
        setRegData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'ROLE_DEV',
          department: 'Engineering',
          designation: 'Full Stack Developer',
          dateOfBirth: '',
          bestFriendName: ''
        });
        setTimeout(() => {
          setActiveTab('login');
          setRegSuccessMsg('');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server. Please try again.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');

    if (!forgotData.email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!forgotData.dateOfBirth && !forgotData.bestFriendName) {
      setErrorMsg('Please enter your Date of Birth OR Best Friend Name to verify your identity.');
      return;
    }

    if (!forgotData.newPassword || forgotData.newPassword !== forgotData.confirmNewPassword) {
      setErrorMsg('New password and confirmation must match.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotData.email,
          dateOfBirth: forgotData.dateOfBirth,
          bestFriendName: forgotData.bestFriendName,
          newPassword: forgotData.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccessMsg('Password reset successfully! You can now log in with your new password.');
        setForgotData({
          email: '',
          dateOfBirth: '',
          bestFriendName: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setTimeout(() => {
          setActiveTab('login');
          setRegSuccessMsg('');
        }, 2500);
      } else {
        setErrorMsg(data.message || 'Password reset verification failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the database server.');
    }
  };

  const demoAccounts = [
    { email: 'admin@aureon.com', role: 'ROLE_ADMIN', label: 'System Admin (Gayathri)', icon: Shield, color: 'bg-purple-600' },
    { email: 'manager@aureon.com', role: 'ROLE_PM', label: 'Project Manager (Sarah)', icon: Layers, color: 'bg-[#4f46e5]' },
    { email: 'lead@aureon.com', role: 'ROLE_LEAD', label: 'Team Lead (David)', icon: UserCheck, color: 'bg-amber-600' },
    { email: 'ram.dev@aureon.com', role: 'ROLE_DEV', label: 'Developer (Ram Kumar)', icon: Laptop, color: 'bg-emerald-600' },
    { email: 'venu.qa@aureon.com', role: 'ROLE_QA', label: 'QA Engineer (Venu QA)', icon: Bug, color: 'bg-rose-600' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] p-6 font-sans relative overflow-hidden text-slate-900 dark:text-slate-100 warm:text-[#342314] transition-colors duration-200">
      {/* Top Header Link */}
      {onNavigateHome && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] text-xs font-bold text-slate-700 dark:text-slate-300 warm:text-[#342314] hover:opacity-90 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
          </button>
        </div>
      )}

      <div className="w-full max-w-lg relative z-10 space-y-5 my-8">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-600 warm:from-amber-700 warm:to-amber-900 text-white font-black text-2xl shadow-xl mb-3">
            A
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white warm:text-[#342314] tracking-tight">Aureon Enterprise Access Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] mt-1">Sign in to your account or register a new team member</p>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="flex bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] p-1 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 warm:text-[#69523c] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 warm:text-[#69523c] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Account
          </button>
        </div>

        {/* Account Lockout Warning */}
        {isLocked && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <div>
              <span className="font-bold block text-white">Account Security Lockout Engaged</span>
              5 consecutive failed login attempts detected. Rate limiting active.
            </div>
          </div>
        )}

        {errorMsg && !isLocked && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {regSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {regSuccessMsg}
          </div>
        )}

        {/* Form Container */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-2xl space-y-5">
          {activeTab === 'login' && (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Corporate Email Address or Username</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin@aureon.com, manager@aureon.com..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span />
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setRegSuccessMsg(''); }}
                  className="text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> Sign In to Role Workspace
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gayathri M"
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@aureon.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Requested Role *</label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  >
                    <option value="ROLE_DEV">Developer</option>
                    <option value="ROLE_LEAD">Team Lead</option>
                    <option value="ROLE_PM">Project Manager</option>
                    <option value="ROLE_QA">QA Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Department</label>
                  <input
                    type="text"
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgotSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@aureon.com"
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Date of Birth (Security Question)</label>
                <input
                  type="date"
                  value={forgotData.dateOfBirth}
                  onChange={(e) => setForgotData({ ...forgotData, dateOfBirth: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotData.newPassword}
                    onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotData.confirmNewPassword}
                    onChange={(e) => setForgotData({ ...forgotData, confirmNewPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 warm:bg-[#f3e8d2] border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] text-slate-900 dark:text-white warm:text-[#342314]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
