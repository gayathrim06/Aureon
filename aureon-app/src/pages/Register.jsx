import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  User,
  AtSign,
  Mail,
  Phone,
  Building,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  GitBranch,
  Camera,
  Upload,
  UserCheck,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';

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

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Avatar & Profile State
  const [avatarMode, setAvatarMode] = useState('preset'); // 'preset' | 'upload'
  const [gender, setGender] = useState('PREFER_NOT_TO_SAY'); // 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS.MALE[0].url);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      organization: '',
      role: 'Developer',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password', '');

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-gray-600' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, label: 'Weak', color: 'bg-[#EF4444]' };
    if (score <= 50) return { score: 50, label: 'Fair', color: 'bg-[#F59E0B]' };
    if (score <= 75) return { score: 75, label: 'Good', color: 'bg-[#38BDF8]' };
    return { score: 100, label: 'Strong', color: 'bg-[#10B981]' };
  };

  const strength = getPasswordStrength(watchPassword);

  const handleGenderChange = (e) => {
    const val = e.target.value;
    setGender(val);
    if (avatarMode === 'preset') {
      if (val === 'FEMALE') {
        setSelectedAvatar(PRESET_AVATARS.FEMALE[0].url);
      } else if (val === 'MALE') {
        setSelectedAvatar(PRESET_AVATARS.MALE[0].url);
      } else {
        setSelectedAvatar(PRESET_AVATARS.NEUTRAL[0].url);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPreview(reader.result);
        setAvatarMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
    setAvatarMode('preset');
  };

  const [apiError, setApiError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');

    if (!data.dateOfBirth && !data.petName && !data.schoolFriendName) {
      setApiError('Please provide at least one security answer (Date of Birth, Pet Name, or School Friend Name) for account recovery.');
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.fullName,
          username: data.username,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role_code: data.role === 'Developer' ? 'ROLE_DEV' : data.role === 'QA Engineer' ? 'ROLE_QA' : data.role === 'Team Lead' ? 'ROLE_LEAD' : data.role === 'Project Manager' ? 'ROLE_PM' : 'ROLE_ADMIN',
          department: data.department,
          designation: data.designation,
          date_of_birth: data.dateOfBirth || null,
          pet_name: data.petName || '',
          school_friend_name: data.schoolFriendName || ''
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        if (resData.access) {
          sessionStorage.setItem('aureon_access_token', resData.access);
        }
        authRegister({ ...data, date_of_birth: data.dateOfBirth, pet_name: data.petName, school_friend_name: data.schoolFriendName });
      } else {
        setApiError(resData.message || 'Registration failed. Please check your information and try again.');
      }
    } catch {
      authRegister({ ...data, date_of_birth: data.dateOfBirth, pet_name: data.petName, school_friend_name: data.schoolFriendName });
    }
    setIsLoading(false);
  };

  const activePresets = gender === 'FEMALE' 
    ? [...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL]
    : gender === 'MALE'
    ? [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.NEUTRAL]
    : [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL];

  return (
    <div className="min-h-screen w-full bg-[#020617] text-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* LEFT PANEL: Branding */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-[#020617] bg-radial-navy bg-grid-blueprint p-12 flex-col justify-between overflow-hidden border-r border-[#334155]/60">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#2563EB]/40">
            A
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-[#F8FAFC]">AUREON</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#38BDF8]">
              Software Engineering Intelligence
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 rounded-full text-xs font-semibold">
            <GitBranch className="w-3.5 h-3.5" /> Enterprise Onboarding
          </div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight leading-snug">
            Join Thousands of High-Performing Engineering Teams
          </h2>
          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            Gain full visibility into software projects, static analysis metrics, team capacity, and automated build stability with Aureon.
          </p>

          <div className="space-y-2 pt-4">
            {['Zero configuration webhooks', 'SonarQube static analysis sync', 'Automated PDF/CSV executive reports', 'Custom profile avatar & photo customization'].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[#F8FAFC]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#64748B]">
          © 2026 Aureon. Enterprise Engineering Platform.
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-[58%] bg-[#0F172A] p-6 sm:p-12 overflow-y-auto flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl glass-panel p-8 rounded-[18px] shadow-2xl border border-[#334155] my-6"
        >
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center justify-between">
              <span>{apiError}</span>
              <button type="button" onClick={() => setApiError('')} className="text-red-400 hover:text-red-300 font-bold ml-2">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* SECURITY RECOVERY QUESTIONS SECTION */}
            <div className="p-4 bg-[#111827]/90 rounded-[16px] border border-[#334155] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#38BDF8]" /> Security & Password Recovery Details
                </label>
                <span className="text-[11px] text-[#38BDF8] font-semibold">(Provide at least 1 answer)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-[#0F172A] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:border-[#2563EB] focus:outline-none"
                    {...register('dateOfBirth')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">Pet Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bruno"
                    className="w-full px-3 py-2 bg-[#0F172A] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:border-[#2563EB] focus:outline-none"
                    {...register('petName')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">School Friend Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ankit"
                    className="w-full px-3 py-2 bg-[#0F172A] text-[#F8FAFC] text-xs rounded-xl border border-[#334155] focus:border-[#2563EB] focus:outline-none"
                    {...register('schoolFriendName')}
                  />
                </div>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="Gayathri Ramesh"
                icon={User}
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />

              {/* Username */}
              <Input
                label="Username"
                placeholder="gayathri_dev"
                icon={AtSign}
                error={errors.username?.message}
                {...register('username', { required: 'Username is required' })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                placeholder="gayathri@company.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email', { required: 'Email address is required' })}
              />

              {/* Phone */}
              <Input
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
                icon={Phone}
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Organization */}
              <Input
                label="Organization (Optional)"
                placeholder="Aureon Engineering"
                icon={Building}
                {...register('organization')}
              />

              {/* Role Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Engineering Role
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25 focus:outline-none"
                    {...register('role')}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="QA Engineer">QA Engineer</option>
                  </select>
                </div>
              </div>
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                icon={Lock}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#94A3B8] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' }
                })}
              />

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  validate: (value) => value === watchPassword || 'Passwords do not match'
                })}
              />
            </div>

            {/* Password Strength Indicator */}
            {watchPassword && (
              <div className="space-y-1.5 p-3 bg-[#111827] rounded-[12px] border border-[#334155]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8]">Password Strength:</span>
                  <span className="font-semibold text-[#F8FAFC]">{strength.label}</span>
                </div>
                <ProgressBar progress={strength.score} color={strength.color} showPercentage={false} height="h-1.5" />
              </div>
            )}

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#CBD5E1]">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-[#334155] bg-[#111827] text-[#2563EB] focus:ring-[#2563EB]"
                  {...register('terms', { required: 'You must agree to the Terms' })}
                />
                <span>
                  I agree to Aureon's{' '}
                  <a href="#" className="text-[#38BDF8] underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-[#38BDF8] underline">Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-[#EF4444] mt-1">{errors.terms.message}</p>}
            </div>

            {/* Primary Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-4"
            >
              Create Engineering Account
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
