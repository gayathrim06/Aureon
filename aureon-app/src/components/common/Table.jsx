import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={`
      transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3.5 text-slate-800 dark:text-slate-200 whitespace-nowrap align-middle ${className}`}>
    {children}
  </td>
);
