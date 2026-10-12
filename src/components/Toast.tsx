import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-white', border: 'border-brand-500', iconColor: 'text-brand-600' },
  error: { icon: XCircle, bg: 'bg-white', border: 'border-red-500', iconColor: 'text-red-600' },
  warning: { icon: AlertCircle, bg: 'bg-white', border: 'border-gold-500', iconColor: 'text-gold-600' },
  info: { icon: Info, bg: 'bg-white', border: 'border-teal-500', iconColor: 'text-teal-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={`toast-enter pointer-events-auto flex items-start gap-3 ${config.bg} border-l-4 ${config.border} rounded-xl shadow-premium p-4 pr-3`}
            >
              <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-slate-700 font-medium flex-1 leading-relaxed">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
