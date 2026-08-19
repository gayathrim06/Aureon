import React from 'react';

export const SkeletonLoader = ({ count = 3, className = "h-12 w-full" }) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#334155]/40 rounded-[12px] ${className}`}
        />
      ))}
    </div>
  );
};
