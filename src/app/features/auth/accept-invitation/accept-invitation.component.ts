import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-accept-invitation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './accept-invitation.component.html',
})
export class AcceptInvitationComponent implements OnInit {
    token = signal('');
    email = signal('');
    firstName = signal('');
    lastName = signal('');
    password = signal('');
    confirmPassword = signal('');
    loading = signal(false);
    error = signal('');

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.token.set(params['token'] || '');
            this.email.set(params['email'] || '');

            if (!this.token()) {
                this.error.set('Invalid invitation link. Token is missing.');
            }
        });
    }

    async onSubmit() {
        if (this.password() !== this.confirmPassword()) {
            this.error.set('Passwords do not match');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        try {
            const user = await this.authService.acceptInvitation(
                this.token(),
                this.email(),
                this.firstName(),
                this.lastName(),
                this.password()
            );

            // Redirect to dashboard on success
            const subdomain = user?.tenant?.subdomain;
            if (subdomain) {
                const protocol = window.location.protocol;
                const port = window.location.port ? `:${window.location.port}` : '';
                const currentHost = window.location.hostname;

                // Determine base domain
                let baseDomain = 'jeufutbol.com.tr';
                if (currentHost.includes('localhost')) {
                    baseDomain = 'localhost';
                } else if (currentHost.endsWith('jeufutbol.com.tr')) {
                    baseDomain = 'jeufutbol.com.tr';
                }

                // Construct new URL
                // If we are already on the correct subdomain, just navigate
                if (currentHost === `${subdomain}.${baseDomain}`) {
                    this.router.navigate(['/dashboard']);
                } else {
                    const newUrl = `${protocol}//${subdomain}.${baseDomain}${port}/dashboard`;
                    window.location.href = newUrl;
                }
            } else {
                this.router.navigate(['/dashboard']);
            }
        } catch (err: any) {
            console.error('Error accepting invitation:', err);
            this.error.set(err.message || 'Failed to accept invitation. Please try again.');
        } finally {
            this.loading.set(false);
        }
    }
}
