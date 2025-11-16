import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.authService.login(this.email(), this.password());
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error.set(error.message || 'Login failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}