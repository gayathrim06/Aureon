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

    if (!regData.fullName || !regData.email || !regData.password || !regData.confirmPassword || !regData.dateOfBirth || !regData.bestFriendName) {
      setErrorMsg('Please fill in all required fields.');
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
        // Clear state
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
      setErrorMsg('Failed to connect to the backend database server.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');

    if (!forgotData.email || !forgotData.dateOfBirth || !forgotData.bestFriendName || !forgotData.newPassword || !forgotData.confirmNewPassword) {
      setErrorMsg('Please fill in all recovery fields.');
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
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
    { email: 'manager@aureon.com', role: 'ROLE_PM', label: 'Project Manager (Sarah Jenkins)', icon: Layers, color: 'bg-blue-600' },
    { email: 'lead@aureon.com', role: 'ROLE_LEAD', label: 'Team Lead (David Chen)', icon: UserCheck, color: 'bg-amber-600' },
    { email: 'ram.dev@aureon.com', role: 'ROLE_DEV', label: 'Developer (Ram Kumar)', icon: Laptop, color: 'bg-emerald-600' },
    { email: 'venu.qa@aureon.com', role: 'ROLE_QA', label: 'QA Engineer (Venu QA)', icon: Bug, color: 'bg-rose-600' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden text-slate-100">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Link */}
      {onNavigateHome && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
          </button>
        </div>
      )}

      <div className="w-full max-w-lg relative z-10 space-y-5 my-8">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl shadow-xl shadow-blue-500/20 mb-3">
            A
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Aureon Enterprise Access Portal</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in to your account or register a new team member</p>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create New Account / Register
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
        <div className="p-6 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-2xl backdrop-blur-xl space-y-5">
          {activeTab === 'login' && (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  placeholder="admin@aureon.com, manager@aureon.com..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-400">
                <span />
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setRegSuccessMsg(''); }}
                  className="hover:text-blue-400 font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> Sign In to Role Workspace
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Gayathri Ramesh"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  placeholder="username@aureon.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {/* Password Recovery Security Section */}
              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-lg space-y-2">
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Security Recovery Questions
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-semibold mb-0.5">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={regData.dateOfBirth}
                      onChange={(e) => setRegData({ ...regData, dateOfBirth: e.target.value })}
                      className="w-full p-2 rounded bg-gray-900 border border-gray-750 text-white focus:outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-semibold mb-0.5">School / Best Friend's Name *</label>
                    <input
                      type="text"
                      required
                      value={regData.bestFriendName}
                      onChange={(e) => setRegData({ ...regData, bestFriendName: e.target.value })}
                      className="w-full p-2 rounded bg-gray-900 border border-gray-750 text-white focus:outline-none text-[11px]"
                      placeholder="Security Answer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Select System Role *</label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                >
                  <option value="ROLE_DEV">Developer (Software Engineering)</option>
                  <option value="ROLE_QA">QA Engineer (Quality Assurance)</option>
                  <option value="ROLE_LEAD">Team Lead (Technical Lead)</option>
                  <option value="ROLE_PM">Project Manager (Product Delivery)</option>
                  <option value="ROLE_ADMIN">System Administrator (Executive)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Department Dropdown *</label>
                  <select
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Product Delivery">Product Delivery</option>
                    <option value="Executive Office">Executive Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Designation / Title *</label>
                  <select
                    value={regData.designation}
                    onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  >
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Senior QA Automation Engineer">Senior QA Automation Engineer</option>
                    <option value="Tech Lead - Core Backend">Tech Lead - Core Backend</option>
                    <option value="Senior Technical Program Manager">Senior Technical Program Manager</option>
                    <option value="Platform Security & System Administrator">Platform Security & System Administrator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" /> Register & Go to Sign In
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-gray-800 pb-2 mb-1">
                <HelpCircle className="w-4 h-4" /> Password Recovery Portal
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  placeholder="e.g. username@aureon.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={forgotData.dateOfBirth}
                    onChange={(e) => setForgotData({ ...forgotData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">School / Best Friend's Name *</label>
                  <input
                    type="text"
                    required
                    value={forgotData.bestFriendName}
                    onChange={(e) => setForgotData({ ...forgotData, bestFriendName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter security answer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={forgotData.newPassword}
                    onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={forgotData.confirmNewPassword}
                    onChange={(e) => setForgotData({ ...forgotData, confirmNewPassword: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(''); setRegSuccessMsg(''); }}
                  className="text-gray-400 hover:text-white underline"
                >
                  Return to Sign In
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Key className="w-4 h-4" /> Reset Password & Go to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default Login;
