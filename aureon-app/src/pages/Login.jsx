import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Key, Lock, AlertTriangle, UserPlus, ArrowLeft, Shield,
  Camera, Upload, UserCheck, X
} from 'lucide-react';

const PRESET_AVATARS = {
  MALE: [
    { id: 'male_1', label: 'Male Dev 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'male_2', label: 'Male Dev 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: 'male_3', label: 'Male Dev 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  ],
  FEMALE: [
    { id: 'female_1', label: 'Female Dev 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'female_2', label: 'Female Dev 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'female_3', label: 'Female Dev 3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  ],
  NEUTRAL: [
    { id: 'tech_1', label: 'Tech Avatar 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: 'tech_2', label: 'Tech Avatar 2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
  ]
};

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
    designation: 'Software Developer',
    gender: 'PREFER_NOT_TO_SAY',
    avatarPreset: PRESET_AVATARS.MALE[0].url
  });

  const [avatarMode, setAvatarMode] = useState('preset'); // 'preset' | 'upload'
  const [uploadedPreview, setUploadedPreview] = useState(null);
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

  const handleGenderChange = (val) => {
    let defaultPreset = PRESET_AVATARS.NEUTRAL[0].url;
    if (val === 'FEMALE') defaultPreset = PRESET_AVATARS.FEMALE[0].url;
    if (val === 'MALE') defaultPreset = PRESET_AVATARS.MALE[0].url;
    setRegData(prev => ({ ...prev, gender: val, avatarPreset: defaultPreset }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPreview(reader.result);
        setAvatarMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedFile = () => {
    setUploadedPreview(null);
    setAvatarMode('preset');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setRegSuccessMsg('');

    if (!regData.fullName || !regData.email || !regData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const finalAvatar = avatarMode === 'upload' && uploadedPreview 
      ? uploadedPreview 
      : regData.avatarPreset;

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
          gender: regData.gender || 'PREFER_NOT_TO_SAY',
          avatar_preset: finalAvatar,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Auto-login the newly registered user using the returned JWT tokens
        localStorage.setItem('aureon_jwt_access_token', data.access);
        localStorage.setItem('aureon_jwt_refresh_token', data.refresh);
        localStorage.setItem('aureon_user_session_token', data.session_token);
        
        const loginRes = await login(regData.email, regData.password);
        if (!loginRes.success) {
          setRegSuccessMsg(`Account created for ${regData.fullName}. Please sign in.`);
          setRegData({ fullName: '', email: '', password: '', role: 'ROLE_DEV', department: 'Engineering', designation: 'Software Developer', gender: 'PREFER_NOT_TO_SAY', avatarPreset: PRESET_AVATARS.MALE[0].url });
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

  const activePresets = regData.gender === 'FEMALE' 
    ? [...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL]
    : regData.gender === 'MALE'
    ? [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.NEUTRAL]
    : [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL];

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
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* PROFILE AVATAR / PHOTO SECTION */}
              <div className="p-3.5 bg-gray-800/80 rounded-xl border border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Profile Photo / Avatar
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAvatarMode('preset')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
                        avatarMode === 'preset'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('upload')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
                        avatarMode === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>

                {avatarMode === 'preset' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-gray-400">Gender Filter:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="PREFER_NOT_TO_SAY"
                          checked={regData.gender === 'PREFER_NOT_TO_SAY'}
                          onChange={() => handleGenderChange('PREFER_NOT_TO_SAY')}
                          className="text-blue-600"
                        />
                        <span>Any</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="MALE"
                          checked={regData.gender === 'MALE'}
                          onChange={() => handleGenderChange('MALE')}
                          className="text-blue-600"
                        />
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="FEMALE"
                          checked={regData.gender === 'FEMALE'}
                          onChange={() => handleGenderChange('FEMALE')}
                          className="text-blue-600"
                        />
                        <span>Female</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                      {activePresets.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setRegData(prev => ({ ...prev, avatarPreset: av.url }))}
                          className={`relative rounded-full p-0.5 border-2 transition-all flex-shrink-0 ${
                            regData.avatarPreset === av.url
                              ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-9 h-9 rounded-full object-cover" />
                          {regData.avatarPreset === av.url && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                              <UserCheck className="w-2 h-2" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {uploadedPreview ? (
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-blue-500">
                        <img src={uploadedPreview} alt="Uploaded Avatar" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={clearUploadedFile}
                          className="absolute top-0 right-0 bg-red-600 text-white p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gray-700 border border-dashed border-gray-600 flex items-center justify-center text-gray-400">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs font-semibold rounded-lg cursor-pointer text-white transition-all">
                        <Upload className="w-3 h-3 text-blue-400" />
                        <span>{uploadedPreview ? 'Change Photo' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or GIF (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>

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
                  <option value="ROLE_DEV">Developer</option>
                  <option value="ROLE_QA">QA Engineer</option>
                  <option value="ROLE_LEAD">Team Lead</option>
                  <option value="ROLE_PM">Project Manager</option>
                  <option value="ROLE_ADMIN">Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Department</label>
                  <select
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Product Delivery">Product Delivery</option>
                    <option value="Platform & Infrastructure">Platform & Infrastructure</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Designation / Title</label>
                  <select
                    value={regData.designation}
                    onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  >
                    <option value="Software Developer">Software Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Senior Architect">Senior Architect</option>
                    <option value="Tech Lead">Tech Lead</option>
                    <option value="Senior Project Manager">Senior Project Manager</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="QA Automation Lead">QA Automation Lead</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="CTO / Tech Executive">CTO / Tech Executive</option>
                  </select>
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
