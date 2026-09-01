import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  X,
  ShieldCheck
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
  const [apiError, setApiError] = useState('');

  // Avatar & Profile State
  const [avatarMode, setAvatarMode] = useState('preset');
  const [gender, setGender] = useState('PREFER_NOT_TO_SAY');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS.MALE[0].url);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      department: 'Engineering',
      role: 'ROLE_DEV',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      petName: '',
      schoolFriendName: ''
    }
  });

  const passwordValue = watch('password', '');

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-300' };
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 75) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(passwordValue);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const finalAvatar = avatarMode === 'upload' ? uploadedPreview || selectedAvatar : selectedAvatar;
      const res = await authRegister({
        ...data,
        avatar_url: finalAvatar,
        gender
      });

      if (res && res.success) {
        navigate('/dashboard');
      } else {
        setApiError(res?.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setApiError('Server error encountered during onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPresetList = gender === 'MALE'
    ? [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.NEUTRAL]
    : gender === 'FEMALE'
    ? [...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL]
    : [...PRESET_AVATARS.MALE, ...PRESET_AVATARS.FEMALE, ...PRESET_AVATARS.NEUTRAL];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] text-slate-900 dark:text-slate-100 warm:text-[#342314] flex flex-col lg:flex-row overflow-hidden font-sans transition-colors duration-200">
      {/* LEFT PANEL: Branding */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-slate-100 dark:bg-slate-900 warm:bg-[#e8dbbe] p-12 flex-col justify-between overflow-hidden border-r border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-600 warm:from-amber-700 warm:to-amber-900 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            A
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-slate-900 dark:text-white warm:text-[#342314]">AUREON</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">
              Software Engineering Intelligence
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] border border-indigo-200 dark:border-indigo-800 warm:border-[#b8a074] rounded-full text-xs font-semibold">
            <GitBranch className="w-3.5 h-3.5" /> Enterprise Onboarding
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug text-slate-900 dark:text-white warm:text-[#342314]">
            Join Thousands of High-Performing Engineering Teams
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 warm:text-[#69523c] leading-relaxed">
            Gain full visibility into software projects, static analysis metrics, team capacity, and automated build stability with Aureon.
          </p>

          <div className="space-y-2 pt-4">
            {['Zero configuration webhooks', 'SonarQube static analysis sync', 'Automated PDF/CSV executive reports', 'Custom profile avatar & photo customization'].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 warm:text-[#342314]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 dark:text-slate-500 warm:text-[#69523c]">
          © 2026 Aureon. Enterprise Engineering Platform.
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-[58%] bg-slate-50 dark:bg-slate-950 warm:bg-[#f3e8d2] p-6 sm:p-12 overflow-y-auto flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] p-8 rounded-[18px] shadow-2xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] my-6"
        >
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-between">
              <span>{apiError}</span>
              <button type="button" onClick={() => setApiError('')} className="text-rose-400 font-bold ml-2">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* SECURITY RECOVERY QUESTIONS SECTION */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f3e8d2] rounded-[16px] border border-slate-200 dark:border-slate-700 warm:border-[#b8a074] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Security & Password Recovery Details
                </label>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-semibold">(Provide at least 1 answer)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-slate-900 dark:text-white warm:text-[#342314] text-xs rounded-xl border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('dateOfBirth')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">Pet Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bruno"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-slate-900 dark:text-white warm:text-[#342314] text-xs rounded-xl border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('petName')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300 warm:text-[#342314]">School Friend Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ankit"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] text-slate-900 dark:text-white warm:text-[#342314] text-xs rounded-xl border border-slate-300 dark:border-slate-700 warm:border-[#b8a074] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('schoolFriendName')}
                  />
                </div>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Gayathri Ramesh"
                icon={User}
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />

              <Input
                label="Username"
                placeholder="gayathri_dev"
                icon={AtSign}
                error={errors.username?.message}
                {...register('username', { required: 'Username is required' })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Corporate Email"
                placeholder="user@aureon.com"
                type="email"
                icon={Mail}
                error={errors.email?.message}
                {...register('email', { required: 'Email address is required' })}
              />

              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                icon={Phone}
                {...register('phone')}
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  label="Password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                />
                {passwordValue && (
                  <div className="mt-1">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Strength: {passStrength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${passStrength.color} transition-all duration-300`} style={{ width: `${passStrength.score}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  validate: (val) => val === passwordValue || 'Passwords do not match'
                })}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
              <span className="text-slate-600 dark:text-slate-400 warm:text-[#69523c]">Already have an account?</span>
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] hover:underline">
                Sign In
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] text-white font-bold text-xs shadow-lg transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Complete Onboarding & Access Portal'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
