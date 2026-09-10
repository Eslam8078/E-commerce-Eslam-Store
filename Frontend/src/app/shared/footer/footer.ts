import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  currentYear = new Date().getFullYear();

  constructor(public authService: AuthService) {}

  accountLink(): string {
    if (this.authService.isCustomer()) return '/user/profile';
    if (this.authService.isAdmin()) return '/admin/dashboard';
    return '/auth/login';
  }
}
