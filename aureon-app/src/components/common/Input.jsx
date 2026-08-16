import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  success,
  helperText,
  icon: Icon,
  rightElement,
  fullWidth = true,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-purple-950/80 dark:text-purple-200/80">
          {label}
        </label>
      )}
      <div className="relative rounded-[12px]">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 dark:text-purple-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full px-3.5 py-2.5 bg-white dark:bg-[#191128] text-purple-950 dark:text-purple-100 placeholder-purple-300 dark:placeholder-purple-500/60 text-sm rounded-[12px]
            border transition-all duration-200 focus:outline-none
            ${Icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error 
              ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30' 
              : success 
              ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/30' 
              : 'border-purple-200 dark:border-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 focus:border-purple-600 dark:focus:border-fuchsia-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-fuchsia-400/20'
            }
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-purple-500/70 dark:text-purple-400/70">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
