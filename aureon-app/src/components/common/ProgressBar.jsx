import React from 'react';

export const ProgressBar = ({
  progress = 0,
  color = "bg-[#2563EB]",
  showPercentage = true,
  height = "h-2",
  className = ""
}) => {
  const cappedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-[#334155]/60 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${cappedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
          <span>Progress</span>
          <span className="font-semibold text-[#CBD5E1]">{cappedProgress}%</span>
        </div>
      )}
    </div>
  );
};
