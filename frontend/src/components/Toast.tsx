"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

const ToastContext = createContext<{
    toast: (message: string, type?: "success" | "error" | "info") => void;
}>({ toast: () => { } });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (message: string, type: "success" | "error" | "info" = "info") => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        },
        []
    );

    const colors = {
        success: "border-green-500/40 bg-green-500/10 text-green-400",
        error: "border-red-500/40 bg-red-500/10 text-red-400",
        info: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    };

    const icons = { success: "✅", error: "❌", info: "ℹ️" };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-xl shadow-lg animate-fade-in ${colors[t.type]}`}
                    >
                        {icons[t.type]} {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
