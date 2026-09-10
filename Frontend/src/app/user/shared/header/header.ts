import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  cartCount = 0;
  unreadCount = 0;
  menuOpen = false;

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
      this.cdr.detectChanges();
    });

    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (this.authService.isCustomer()) {
      this.cartService.getCart().subscribe();
    }

    this.notificationService.getMyNotifications({
      unread: true,
      limit: 1,
    }).subscribe({
      next: (response) => {
        this.unreadCount = response.unreadCount || 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
    });
  }

  get currentUser() {
    return this.authService.getUser();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
