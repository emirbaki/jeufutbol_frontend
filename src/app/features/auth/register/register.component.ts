import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  firstName = signal('');
  lastName = signal('');
  organizationName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal('');
  verificationText = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async onSubmit() {
    // Validation
    if (!this.firstName() || !this.lastName() || !this.organizationName() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }

    if (this.password().length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const verText = await this.authService.register(this.email(), this.password(), this.firstName(), this.lastName(), this.organizationName());
      this.verificationText.set(verText);
      // this.router.navigate(['/auth/verify-email'], { queryParams: { token: verificationText } });
    } catch (error: any) {
      this.error.set(error.message || 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}