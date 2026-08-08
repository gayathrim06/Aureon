import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 5,
  onPageChange,
  totalItems = 42,
  itemsPerPage = 10
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs text-[#94A3B8]">
      <div>
        Showing <span className="font-semibold text-[#F8FAFC]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#F8FAFC]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#F8FAFC]">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 border border-[#334155] rounded-[12px] bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-8 h-8 rounded-[12px] text-xs font-medium transition-colors border
              ${currentPage === page
                ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                : 'bg-[#111827] text-[#CBD5E1] border-[#334155] hover:bg-[#1F2937]'
              }
            `}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border border-[#334155] rounded-[12px] bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
