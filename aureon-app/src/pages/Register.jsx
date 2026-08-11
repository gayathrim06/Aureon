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

  const onSubmit = (data) => {
    setIsLoading(true);
    const finalAvatar = avatarMode === 'upload' && uploadedPreview 
      ? uploadedPreview 
      : selectedAvatar;

    const payload = {
      ...data,
      gender,
      avatarPreset: avatarMode === 'preset' ? selectedAvatar : null,
      profileImagePreview: finalAvatar,
      profileFile: uploadedFile,
    };

    setTimeout(() => {
      setIsLoading(false);
      authRegister(payload);
      navigate('/dashboard');
    }, 1200);
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
          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Create Your Aureon Account</h3>
            <p className="text-xs text-[#94A3B8] mt-1">Start collaborating with your engineering team.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* AVATAR & PHOTO SELECTION SECTION */}
            <div className="p-4 bg-[#111827]/90 rounded-[16px] border border-[#334155] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Profile Avatar / Photo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('preset')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                      avatarMode === 'preset'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Preset Avatars
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                      avatarMode === 'upload'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              {/* GENDER & PRESET SELECTOR */}
              {avatarMode === 'preset' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#94A3B8] font-medium">Gender Option:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="PREFER_NOT_TO_SAY"
                        checked={gender === 'PREFER_NOT_TO_SAY'}
                        onChange={handleGenderChange}
                        className="text-[#2563EB]"
                      />
                      <span>Any</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="MALE"
                        checked={gender === 'MALE'}
                        onChange={handleGenderChange}
                        className="text-[#2563EB]"
                      />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="FEMALE"
                        checked={gender === 'FEMALE'}
                        onChange={handleGenderChange}
                        className="text-[#2563EB]"
                      />
                      <span>Female</span>
                    </label>
                  </div>

                  {/* Preset Grid */}
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {activePresets.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.url)}
                        className={`relative rounded-full p-0.5 border-2 transition-all flex-shrink-0 ${
                          selectedAvatar === av.url
                            ? 'border-[#2563EB] scale-105 shadow-md shadow-[#2563EB]/40'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-11 h-11 rounded-full object-cover" />
                        {selectedAvatar === av.url && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center text-white">
                            <UserCheck className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* UPLOAD PHOTO SECTION */
                <div className="flex items-center gap-4">
                  {uploadedPreview ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#2563EB]">
                      <img src={uploadedPreview} alt="Uploaded Avatar" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearUploadedFile}
                        className="absolute top-0 right-0 bg-red-600/80 hover:bg-red-600 text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#1E293B] border-2 border-dashed border-[#475569] flex items-center justify-center text-[#94A3B8]">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-xs font-semibold rounded-xl cursor-pointer text-[#F8FAFC] transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{uploadedPreview ? 'Change Photo' : 'Select Photo from Computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-[#64748B] mt-1">PNG, JPG, or GIF (Max 5MB)</p>
                  </div>
                </div>
              )}
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
              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Department
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25 focus:outline-none"
                  {...register('department')}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Product Delivery">Product Delivery</option>
                  <option value="Platform & Infrastructure">Platform & Infrastructure</option>
                  <option value="Executive Management">Executive Management</option>
                </select>
              </div>

              {/* Designation Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Designation / Title
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] text-sm rounded-[12px] border border-[#334155] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25 focus:outline-none"
                  {...register('designation')}
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
