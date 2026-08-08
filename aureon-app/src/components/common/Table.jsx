import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-[#334155] rounded-[12px] bg-[#1F2937]/50 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#111827] border-b border-[#334155]">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]/60 text-sm">
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
      transition-colors duration-150 hover:bg-[#273549]/70
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3.5 text-[#CBD5E1] whitespace-nowrap align-middle ${className}`}>
    {children}
  </td>
);
