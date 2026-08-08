import React from 'react';

export const CircularProgress = ({
  score = 94,
  size = 120,
  strokeWidth = 10,
  label = "Health Score",
  sublabel = "Optimal",
  color = "#2563EB"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#334155"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-[#F8FAFC] tracking-tight">{score}%</span>
          <span className="text-[10px] uppercase font-semibold text-[#10B981] tracking-wider">{sublabel}</span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-[#CBD5E1] mt-2">{label}</span>}
    </div>
  );
};
