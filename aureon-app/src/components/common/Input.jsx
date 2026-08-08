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
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
          {label}
        </label>
      )}
      <div className="relative rounded-[12px]">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full px-3.5 py-2.5 bg-[#111827] text-[#F8FAFC] placeholder-[#64748B] text-sm rounded-[12px]
            border transition-all duration-200 focus:outline-none
            ${Icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error 
              ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30' 
              : success 
              ? 'border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30' 
              : 'border-[#334155] hover:border-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25'
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
        <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[#94A3B8]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
