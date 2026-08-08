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
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  GitBranch,
  Code
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
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

  const onSubmit = (data) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      authRegister(data);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* LEFT PANEL: Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#020617] bg-radial-navy bg-grid-blueprint p-12 flex-col justify-between overflow-hidden border-r border-[#334155]/60">
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
            {['Zero configuration webhooks', 'SonarQube static analysis sync', 'Automated PDF/CSV executive reports', 'Enterprise role-based access controls'].map((item, i) => (
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
      <div className="w-full lg:w-[55%] bg-[#0F172A] p-6 sm:p-12 overflow-y-auto flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl glass-panel p-8 rounded-[18px] shadow-2xl border border-[#334155] my-6"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Create Your Aureon Account</h3>
            <p className="text-xs text-[#94A3B8] mt-1">Start collaborating with your engineering team.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="pt-2">
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
