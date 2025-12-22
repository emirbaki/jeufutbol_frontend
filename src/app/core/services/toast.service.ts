import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
    action?: {
        label: string;
        callback: () => void;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = signal<Toast[]>([]);

    readonly activeToasts = computed(() => this.toasts());

    private generateId(): string {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private show(message: string, type: ToastType, duration: number = 4000, action?: Toast['action']): string {
        const id = this.generateId();
        const toast: Toast = { id, message, type, duration, action };

        this.toasts.update(toasts => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        return id;
    }

    dismiss(id: string): void {
        this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }

    dismissAll(): void {
        this.toasts.set([]);
    }

    success(message: string, duration: number = 4000, action?: Toast['action']): string {
        return this.show(message, 'success', duration, action);
    }

    error(message: string, duration: number = 5000, action?: Toast['action']): string {
        return this.show(message, 'error', duration, action);
    }

    info(message: string, duration: number = 4000, action?: Toast['action']): string {
        return this.show(message, 'info', duration, action);
    }

    warning(message: string, duration: number = 4500, action?: Toast['action']): string {
        return this.show(message, 'warning', duration, action);
    }
}
