import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, Key, Lock, AlertTriangle, ArrowRight, CheckCircle2, 
  UserCheck, Laptop, Layers, Bug, ArrowLeft, Info, UserPlus, HelpCircle, Calendar, User,
  Sun, Moon, Coffee
} from 'lucide-react';

export const Login = ({ onNavigateHome }) => {
  const { login, isLocked } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    { email: 'admin@aureon.com', role: 'ROLE_ADMIN', label: 'System Admin (Gayathri M)', icon: Shield, color: 'bg-purple-600' },
    { email: 'eli@aureon.com', role: 'ROLE_PM', label: 'Project Manager (Elizabeth M)', icon: Layers, color: 'bg-[#4f46e5]' },
    { email: 'krish@aureon.com', role: 'ROLE_LEAD', label: 'Tech Lead (Krishna Deepesh)', icon: UserCheck, color: 'bg-amber-600' },
    { email: 'sainu@aureon.com', role: 'ROLE_DEV', label: 'Frontend Dev (Sainu Anna)', icon: Laptop, color: 'bg-emerald-600' },
    { email: 'jiya@aureon.com', role: 'ROLE_DEV', label: 'Software Dev (Jiya Thomas)', icon: Laptop, color: 'bg-indigo-600' },
    { email: 'rinta@aureon.com', role: 'ROLE_DEV', label: 'Full Stack Dev (Rinta Thomas)', icon: Laptop, color: 'bg-blue-600' },
    { email: 'feba@aureon.com', role: 'ROLE_QA', label: 'Executive QA (Feba Biju)', icon: Bug, color: 'bg-rose-600' },
    { email: 'bugcheck_user@aureon.com', role: 'ROLE_DEV', label: 'QA Tester (BugCheck User)', icon: Bug, color: 'bg-cyan-600' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] p-6 font-sans relative overflow-hidden text-slate-900 dark:text-slate-100 warm:text-[#342314] transition-colors duration-200">
      {/* Top Header Link & Theme Switcher */}
      <div className="absolute top-6 left-6 z-20">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] text-xs font-bold text-slate-700 dark:text-slate-300 warm:text-[#342314] hover:opacity-90 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
          </button>
        )}
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] text-slate-700 dark:text-slate-300 warm:text-[#342314] hover:opacity-90 transition-colors shadow-sm"
          title={`Current Theme: ${theme === 'dark' ? 'Dark Obsidian' : theme === 'warm' ? 'Warm Eye-Care Sepia' : 'Clean Light'} (Click to switch)`}
        >
          {theme === 'dark' && <Sun className="w-4 h-4 text-amber-400" />}
          {theme === 'light' && <Coffee className="w-4 h-4 text-amber-700" />}
          {theme === 'warm' && <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white font-black text-xl shadow-lg shadow-indigo-600/20 mb-1">
            A
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white warm:text-[#342314]">
            Aureon SaaS Platform
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
            Role-Based Engineering Intelligence Portal
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-200/60 dark:bg-slate-900/60 warm:bg-[#e8dbbe] p-1 border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-800 warm:bg-[#f3e8d2] text-slate-900 dark:text-white warm:text-[#342314] shadow-sm'
                : 'text-slate-500 dark:text-slate-400 warm:text-[#69523c] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-800 warm:bg-[#f3e8d2] text-slate-900 dark:text-white warm:text-[#342314] shadow-sm'
                : 'text-slate-500 dark:text-slate-400 warm:text-[#69523c] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setRegSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'forgot'
                ? 'bg-white dark:bg-slate-800 warm:bg-[#f3e8d2] text-slate-900 dark:text-white warm:text-[#342314] shadow-sm'
                : 'text-slate-500 dark:text-slate-400 warm:text-[#69523c] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Lockout Warning Alert */}
        {isLocked && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Account temporarily locked due to excessive failed attempts. Try again later.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {regSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{regSuccessMsg}</span>
          </div>
        )}

        {/* ━━━ TAB 1: SIGN IN ━━━ */}
        {activeTab === 'login' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xl space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@aureon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-mono text-slate-900 dark:text-white warm:text-[#342314] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-xs font-mono text-slate-900 dark:text-white warm:text-[#342314] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Quick Accounts Presets */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 warm:border-[#cbb68e] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 warm:text-[#69523c]">
                Quick Demo Presets (Password: <span className="font-mono text-indigo-600 warm:text-[#b45309]">Aureon@123</span>)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword('Aureon@123'); }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 warm:bg-[#f3e8d2] border border-slate-200 dark:border-slate-700 warm:border-[#b8a074] text-left hover:border-indigo-500 transition-all flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${acc.color} shrink-0`} />
                    <span className="text-[10px] font-semibold truncate text-slate-700 dark:text-slate-300 warm:text-[#342314]">{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB 2: REGISTER ━━━ */}
        {activeTab === 'register' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xl space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex.rivera@aureon.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">RBAC Role</label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                >
                  <option value="ROLE_DEV">Developer</option>
                  <option value="ROLE_LEAD">Team Lead</option>
                  <option value="ROLE_PM">Project Manager</option>
                  <option value="ROLE_QA">QA Engineer</option>
                  <option value="ROLE_ADMIN">System Admin</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-indigo-600 warm:text-[#b45309] uppercase tracking-wider block mb-2">
                  Account Recovery Security Questions
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={regData.dateOfBirth}
                      onChange={(e) => setRegData({ ...regData, dateOfBirth: e.target.value })}
                      className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Best Friend's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Samuel"
                      value={regData.bestFriendName}
                      onChange={(e) => setRegData({ ...regData, bestFriendName: e.target.value })}
                      className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 warm:bg-[#b45309] text-white font-bold shadow-md transition-all mt-2"
              >
                Register Account
              </button>
            </form>
          </div>
        )}

        {/* ━━━ TAB 3: FORGOT PASSWORD ━━━ */}
        {activeTab === 'forgot' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-xl space-y-4">
            <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@aureon.com"
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-indigo-600 warm:text-[#b45309] uppercase tracking-wider block mb-2">
                  Verify Security Answer
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={forgotData.dateOfBirth}
                      onChange={(e) => setForgotData({ ...forgotData, dateOfBirth: e.target.value })}
                      className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">OR Best Friend's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Samuel"
                      value={forgotData.bestFriendName}
                      onChange={(e) => setForgotData({ ...forgotData, bestFriendName: e.target.value })}
                      className="w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={forgotData.newPassword}
                      onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={forgotData.confirmNewPassword}
                      onChange={(e) => setForgotData({ ...forgotData, confirmNewPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 warm:bg-[#b45309] text-white font-bold shadow-md transition-all mt-2"
              >
                Reset Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
