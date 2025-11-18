import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth2.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  loading = signal(true);
  message = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.message.set('Doğrulama tokenı bulunamadı.');
      this.loading.set(false);
      return;
    }

    try {
      const res = await firstValueFrom(this.authService.verifyEmail(token));
      this.message.set(res.message);
    } catch {
      this.message.set('Doğrulama başarısız oldu.');
    }

    this.loading.set(false);
  }
}
