import { Component, signal, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NgOptimizedImage],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    // Check for token in URL (used during cross-subdomain redirect)
    const token = this.route.snapshot.queryParams['token'];
    const pendingPlan = this.route.snapshot.queryParams['pending_plan'];

    if (token && isPlatformBrowser(this.platformId)) {
      // Save token to localStorage on the subdomain
      localStorage.setItem('cokgizli_bir_anahtar', token);

      // Save pending plan if present
      if (pendingPlan) {
        localStorage.setItem('pending_checkout_plan', pendingPlan);
      }

      // Check for pending checkout
      this.checkPendingCheckout();
    }
  }

  private checkPendingCheckout() {
    if (!isPlatformBrowser(this.platformId)) return;

    const pendingPlan = localStorage.getItem('pending_checkout_plan');
    if (pendingPlan && (pendingPlan === 'pro_monthly' || pendingPlan === 'pro_yearly')) {
      this.loading.set(true);
      this.subscriptionService.createCheckout(pendingPlan).subscribe({
        next: (url) => {
          localStorage.removeItem('pending_checkout_plan');
          window.location.href = url;
        },
        error: (err) => {
          console.error('Checkout redirect failed', err);
          this.router.navigate(['/dashboard']);
        }
      });
    } else {
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
      if (user?.tenant?.subdomain && isPlatformBrowser(this.platformId)) {
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

          // Check for pending checkout to pass to subdomain
          const pendingPlan = localStorage.getItem('pending_checkout_plan');
          let redirectUrl = `${protocol}//${expectedHost}${port}/auth/login?token=${token}`;

          if (pendingPlan) {
            redirectUrl += `&pending_plan=${pendingPlan}`;
          }

          // Redirect to subdomain with token and pending plan
          window.location.href = redirectUrl;
          return;
        }
      }

      this.checkPendingCheckout();
    } catch (error: any) {
      this.error.set(error.message || 'Login failed. Please try again.');
      this.loading.set(false);
    }
    // loading set to false handled in checkPendingCheckout or error block
  }
}