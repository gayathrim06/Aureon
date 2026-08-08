import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[12px]';

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white focus:ring-[#2563EB] shadow-md shadow-[#2563EB]/20',
    secondary: 'bg-[#1F2937] hover:bg-[#273549] active:bg-[#111827] text-[#F8FAFC] border border-[#334155] focus:ring-[#334155]',
    outline: 'bg-transparent border border-[#334155] hover:bg-[#1F2937] text-[#CBD5E1] hover:text-white focus:ring-[#334155]',
    danger: 'bg-[#EF4444] hover:bg-red-600 text-white focus:ring-[#EF4444]',
    ghost: 'bg-transparent hover:bg-[#1F2937] text-[#94A3B8] hover:text-[#F8FAFC] focus:ring-[#334155]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
