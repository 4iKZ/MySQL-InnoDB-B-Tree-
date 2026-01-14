import React from 'react';

export type ToastVariant = 'info' | 'error';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`rounded-lg border shadow-lg px-3 py-2 text-sm flex items-start gap-3 ${
            t.variant === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
          role="status"
        >
          <div className="flex-1 leading-snug whitespace-pre-wrap">{t.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-xs px-2 py-1 rounded hover:bg-black/5"
            aria-label="关闭提示"
          >
            关闭
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;

