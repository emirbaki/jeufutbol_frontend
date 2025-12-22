import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 max-w-sm pointer-events-none">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div 
          class="animate-slide-up pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02]"
          [ngClass]="{
            'bg-green-50/95 dark:bg-green-900/90 border-green-200 dark:border-green-800': toast.type === 'success',
            'bg-red-50/95 dark:bg-red-900/90 border-red-200 dark:border-red-800': toast.type === 'error',
            'bg-blue-50/95 dark:bg-blue-900/90 border-blue-200 dark:border-blue-800': toast.type === 'info',
            'bg-amber-50/95 dark:bg-amber-900/90 border-amber-200 dark:border-amber-800': toast.type === 'warning'
          }"
        >
          <!-- Icon -->
          <div class="shrink-0 text-xl">
            @switch (toast.type) {
              @case ('success') { <span>✅</span> }
              @case ('error') { <span>❌</span> }
              @case ('info') { <span>ℹ️</span> }
              @case ('warning') { <span>⚠️</span> }
            }
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium"
              [ngClass]="{
                'text-green-800 dark:text-green-200': toast.type === 'success',
                'text-red-800 dark:text-red-200': toast.type === 'error',
                'text-blue-800 dark:text-blue-200': toast.type === 'info',
                'text-amber-800 dark:text-amber-200': toast.type === 'warning'
              }"
            >
              {{ toast.message }}
            </p>
            
            <!-- Action Button -->
            @if (toast.action) {
              <button 
                (click)="toast.action!.callback(); dismiss(toast.id)"
                class="mt-2 text-xs font-semibold underline underline-offset-2 hover:no-underline transition-all"
                [ngClass]="{
                  'text-green-700 dark:text-green-300': toast.type === 'success',
                  'text-red-700 dark:text-red-300': toast.type === 'error',
                  'text-blue-700 dark:text-blue-300': toast.type === 'info',
                  'text-amber-700 dark:text-amber-300': toast.type === 'warning'
                }"
              >
                {{ toast.action.label }}
              </button>
            }
          </div>
          
          <!-- Close Button -->
          <button 
            (click)="dismiss(toast.id)"
            class="shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            [ngClass]="{
              'text-green-600 dark:text-green-400': toast.type === 'success',
              'text-red-600 dark:text-red-400': toast.type === 'error',
              'text-blue-600 dark:text-blue-400': toast.type === 'info',
              'text-amber-600 dark:text-amber-400': toast.type === 'warning'
            }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(1rem) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .animate-slide-up {
      animation: slide-up 0.3s ease-out forwards;
    }
  `]
})
export class ToastContainerComponent {
    protected toastService = inject(ToastService);

    dismiss(id: string): void {
        this.toastService.dismiss(id);
    }
}
