import React from 'react';

export const Avatar = ({
  name = 'User',
  src,
  size = 'md',
  status = 'online',
  className = '',
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusColors = {
    online: 'bg-[#10B981]',
    busy: 'bg-[#EF4444]',
    away: 'bg-[#F59E0B]',
    offline: 'bg-[#64748B]',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover border border-[#334155]`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]} rounded-full bg-gradient-to-br from-purple-600 to-pink-500
            text-white font-semibold flex items-center justify-center border border-purple-300 dark:border-purple-700
            shadow-inner
          `}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-purple-950
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
};
