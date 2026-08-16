import React from 'react';

export const Badge = ({
  children,
  variant = 'info',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    info: 'bg-purple-500/15 text-purple-700 dark:text-fuchsia-300 border-purple-500/30',
    brand: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-800 dark:text-fuchsia-300 border-purple-500/40 font-semibold',
    neutral: 'bg-purple-100/60 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-900/60',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-purple-500',
    brand: 'bg-fuchsia-500',
    neutral: 'bg-purple-400',
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
