import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Check for token in URL (used during cross-subdomain redirect)
    const token = this.route.snapshot.queryParams['token'];

    if (token) {
      // Save token to localStorage on the subdomain
      localStorage.setItem('cokgizli_bir_anahtar', token);
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    }
  }

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const user = await this.authService.login(this.email(), this.password());

      // Check for tenant subdomain redirect
      if (user?.tenant?.subdomain) {
        const currentHost = window.location.hostname;
        const tenantSubdomain = user.tenant.subdomain;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';

        const isLocal = currentHost.includes('localhost');
        const mainDomain = isLocal ? 'localhost' : 'jeufutbol.com.tr';
        const expectedHost = `${tenantSubdomain}.${mainDomain}`;

        // If we are NOT already on the tenant subdomain
        if (currentHost !== expectedHost) {
          const token = localStorage.getItem('cokgizli_bir_anahtar');
          // Redirect to subdomain with token
          window.location.href = `${protocol}//${expectedHost}${port}/auth/login?token=${token}`;
          return;
        }
      }

      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error.set(error.message || 'Login failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}