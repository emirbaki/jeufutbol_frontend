import { Injectable, signal, effect, Inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    darkMode = signal<boolean>(false);
    private initialized = false;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private injector: Injector
    ) {
        this.initializeTheme();
    }

    private initializeTheme() {
        if (isPlatformBrowser(this.platformId) && !this.initialized) {
            this.initialized = true;

            // Check local storage or system preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.darkMode.set(savedTheme === 'dark');
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.darkMode.set(true);
            }

            // Apply theme class on change using injector context
            effect(() => {
                const isDark = this.darkMode();
                if (isDark) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                }
            }, { injector: this.injector });
        }
    }

    toggleTheme() {
        this.darkMode.update(dark => !dark);
    }

    setDarkMode(isDark: boolean) {
        this.darkMode.set(isDark);
    }

    isDarkMode(): boolean {
        return this.darkMode();
    }
}
