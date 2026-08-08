import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`
        bg-[#1F2937] border border-[#334155] rounded-[16px] p-5
        shadow-lg transition-colors duration-200
        ${hoverEffect ? 'hover:border-[#2563EB]/40 hover:shadow-[#2563EB]/5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between pb-4 border-b border-[#334155]/60 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, icon: Icon, className = '' }) => (
  <h3 className={`text-base font-semibold text-[#F8FAFC] flex items-center gap-2 ${className}`}>
    {Icon && <Icon className="w-5 h-5 text-[#2563EB]" />}
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-xs text-[#94A3B8] mt-0.5 ${className}`}>{children}</p>
);
