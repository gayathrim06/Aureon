import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type = 'info', message, title } = toast;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/80',
    error: 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/80',
    warning: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/80',
    info: 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/80'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-in">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${borderColors[type] || borderColors.info}`}>
        {icons[type] || icons.info}
        <div className="flex-1 pr-2">
          {title && <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{title}</h4>}
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
