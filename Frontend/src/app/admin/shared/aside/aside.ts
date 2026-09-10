import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside implements OnInit, OnDestroy {
  unreadCount = 0;

  private notificationRefreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
    this.notificationRefreshTimer = setInterval(
      () => this.loadUnreadCount(),
      10000,
    );
  }

  ngOnDestroy(): void {
    if (this.notificationRefreshTimer) {
      clearInterval(this.notificationRefreshTimer);
    }
  }

  private loadUnreadCount(): void {
    this.notificationService.getMyNotifications({ limit: 1 }).subscribe({
      next: (response) => {
        this.unreadCount = response.unreadCount || 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.unreadCount = 0;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
