import { createContext, useCallback, useContext, useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}

const ICON_MAP: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLOR_MAP: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-brand-blue)',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const Icon = ICON_MAP[toast.type];
    const color = COLOR_MAP[toast.type];
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const dur = toast.duration ?? 5000;
        timerRef.current = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, dur);
        return () => clearTimeout(timerRef.current);
    }, [toast, onDismiss]);

    return (
        <div
            className={`chiron-toast ${exiting ? 'chiron-toast-exit' : ''}`}
            role="alert"
        >
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <span className="flex-1 text-sm text-[var(--color-text-primary)]">{toast.message}</span>
            <button
                type="button"
                onClick={() => {
                    setExiting(true);
                    setTimeout(() => onDismiss(toast.id), 300);
                }}
                className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idRef = useRef(0);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${++idRef.current}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="chiron-toast-container" aria-live="polite">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
