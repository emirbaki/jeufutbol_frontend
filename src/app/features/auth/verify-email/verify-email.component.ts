import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth3.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  message: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.message = 'Doğrulama tokenı bulunamadı.';
      this.loading = false;
      return;
    }

    try {
      this.message = await this.authService.verifyEmail(token);
    } catch {
      this.message = 'Doğrulama başarısız oldu.';
    }

    this.loading = false;
  }
}
