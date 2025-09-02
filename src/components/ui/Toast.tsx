import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms
}

interface ToastContextValue {
  show: (message: string, options?: { type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, options?: { type?: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).slice(2);
    const toast: ToastItem = {
      id,
      type: options?.type ?? 'info',
      message,
      duration: options?.duration ?? 3000,
    };
    setToasts(prev => [...prev, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const remove = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2 w-[90vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl shadow-medium px-4 py-3 text-sm border flex items-start justify-between ${
              t.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : t.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : t.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <span className="pr-3">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
