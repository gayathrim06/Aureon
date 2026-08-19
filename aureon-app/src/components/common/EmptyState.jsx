import React from 'react';
import { FolderAlert } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  title = "No items found",
  description = "There are no records matching your current filter criteria.",
  icon: Icon = FolderAlert,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111827]/40 border border-dashed border-[#334155] rounded-[16px]">
      <div className="p-4 bg-[#1F2937] text-[#38BDF8] rounded-full mb-3 border border-[#334155]">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-[#F8FAFC]">{title}</h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
