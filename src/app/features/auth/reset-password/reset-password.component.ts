import { Component, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [FormsModule, RouterLink, NgOptimizedImage],
    templateUrl: './reset-password.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
    email = signal('');
    newPassword = signal('');
    token = signal<string | null>(null);

    loading = signal(false);
    error = signal('');
    successMessage = signal('');

    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.token.set(token);
            }
        });
    }

    async onRequestReset() {
        if (!this.email()) {
            this.error.set('Please enter your email address');
            return;
        }

        this.loading.set(true);
        this.error.set('');
        this.successMessage.set('');

        try {
            const message = await this.authService.requestPasswordReset(this.email());
            this.successMessage.set(message || 'Reset link sent to your email.');
        } catch (error: any) {
            this.error.set(error.message || 'Failed to send reset link. Please try again.');
        } finally {
            this.loading.set(false);
        }
    }

    async onConfirmReset() {
        if (!this.newPassword()) {
            this.error.set('Please enter a new password');
            return;
        }

        const token = this.token();
        if (!token) {
            this.error.set('Invalid reset token.');
            return;
        }

        this.loading.set(true);
        this.error.set('');
        this.successMessage.set('');

        try {
            const message = await this.authService.resetPassword(token, this.newPassword());
            this.successMessage.set(message || 'Password reset successfully.');
            setTimeout(() => {
                this.router.navigate(['/auth/login']);
            }, 2000);
        } catch (error: any) {
            this.error.set(error.message || 'Failed to reset password. Please try again.');
        } finally {
            this.loading.set(false);
        }
    }
}
