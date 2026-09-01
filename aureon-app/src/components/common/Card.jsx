import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-[#120c1e] border border-purple-100 dark:border-purple-950/70 rounded-[16px] p-5
        shadow-xs dark:shadow-2xl transition-all duration-200
        ${hoverEffect ? 'hover:-translate-y-0.5 hover:border-purple-300 dark:hover:border-fuchsia-500/50 hover:shadow-md dark:hover:shadow-purple-950/50' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between pb-4 border-b border-purple-100 dark:border-purple-950/70 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, icon: Icon, className = '' }) => (
  <h3 className={`text-base font-semibold text-purple-950 dark:text-purple-100 flex items-center gap-2 ${className}`}>
    {Icon && <Icon className="w-5 h-5 text-purple-600 dark:text-fuchsia-400" />}
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-xs text-purple-600/70 dark:text-purple-300/70 mt-0.5 ${className}`}>{children}</p>
);
