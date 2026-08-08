import React from 'react';

export const Badge = ({
  children,
  variant = 'info',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    success: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    error: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    info: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
    brand: 'bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/30',
    neutral: 'bg-[#334155]/50 text-[#CBD5E1] border-[#334155]',
  };

  const dotColors = {
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#EF4444]',
    info: 'bg-[#38BDF8]',
    brand: 'bg-[#2563EB]',
    neutral: 'bg-[#94A3B8]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
