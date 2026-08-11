import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Key, Lock, AlertTriangle, ArrowRight, CheckCircle2, 
  UserPlus, ArrowLeft, Shield
} from 'lucide-react';

export const Login = ({ onNavigateHome }) => {
  const { login, isLocked, lockoutRemaining } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration Form State
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'ROLE_DEV',
    department: 'Engineering',
    designation: 'Software Developer'
  });
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');

    if (!regData.fullName || !regData.email || !regData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsRegLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regData.fullName,
          email: regData.email,
          password: regData.password,
          role_code: regData.role,
          department: regData.department,
          designation: regData.designation,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Auto-login the newly registered user using the returned JWT tokens
        const loggedUser = data.user;
        localStorage.setItem('aureon_jwt_access_token', data.access);
        localStorage.setItem('aureon_jwt_refresh_token', data.refresh);
        localStorage.setItem('aureon_user_session_token', data.session_token);
        // Use the login function to set the user in auth context
        const loginRes = await login(regData.email, regData.password);
        if (!loginRes.success) {
          // If auto-login fails just redirect to login tab
          setRegSuccessMsg(`Account created for ${regData.fullName}. Please sign in.`);
          setRegData({ fullName: '', email: '', password: '', role: 'ROLE_DEV', department: 'Engineering', designation: 'Software Developer' });
          setTimeout(() => setActiveTab('login'), 2000);
        }
      } else {
        const errors = data?.errors || {};
        const firstError = Object.values(errors)?.[0]?.[0] || data?.detail || 'Registration failed. Please try again.';
        setErrorMsg(firstError);
      }
    } catch {
      setErrorMsg('Unable to reach the server. Please ensure the backend is running on port 8000.');
    }
    setIsRegLoading(false);
  };

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
              5 consecutive failed login attempts detected. Retry in {Math.ceil(lockoutRemaining / 60)} minute(s) or contact your System Administrator.
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
          {activeTab === 'login' ? (
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
                  placeholder="Enter your email address"
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
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {isLoading ? 'Authenticating...' : 'Sign In to Role Workspace'}
              </button>
            </form>
          ) : (
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
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                    placeholder="rahul@aureon.com"
                  />
                </div>

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
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">System Role *</label>
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
                  <label className="block text-gray-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Engineering / QA / PMO"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={regData.designation}
                    onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Senior Developer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isRegLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isRegLoading ? 'Creating Account...' : 'Create Account & Access Platform'}
              </button>
            </form>
          )}

          {/* Security note */}
          <div className="pt-3 border-t border-gray-800 flex items-center gap-2 text-[10px] text-gray-500">
            <Shield className="w-3.5 h-3.5 text-gray-600" />
            Authentication is managed by the Aureon backend. All sessions are secured with JWT tokens.
          </div>
        </div>
      </div>
    </div>
  );
};
