import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];

  unreadCount = 0;

  isLoading = true;

  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.notificationService
      .getMyNotifications({
        page: this.page,
        limit: this.limit,
        sort: 'createdAt',
        order: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.notifications = response.data || [];
          this.totalPages = response.pagination?.totalPages ?? response.pages ?? 1;
          this.page = response.pagination?.page ?? response.page ?? this.page;
          this.unreadCount = response.unreadCount || 0;
          this.isLoading = false;

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message ||
            'Failed to load notifications';

          this.isLoading = false;

          this.cdr.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.load();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService
      .markAsRead(notification._id)
      .subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(
            0,
            this.unreadCount - 1
          );

          this.cdr.detectChanges();
        },
      });
  }

  openNotification(notification: Notification): void {
    const isAdmin = this.authService.isAdmin();
    const isCustomer = this.authService.isCustomer();
    const relatedId = notification.relatedId || '';
    const validOrderId = /^[a-fA-F0-9]{24}$/.test(relatedId);

    const openTarget = () => {
      const relatedType = notification.relatedType;

      if (relatedType === 'testimonial' ||
          ['new_testimonial', 'testimonial_approved', 'testimonial_declined'].includes(notification.type)) {
        this.router.navigateByUrl(
          isAdmin ? '/admin/testimonials' : '/user/testimonials/list',
        );
        return;
      }

      if (relatedType === 'order' ||
          ['new_order', 'refund_requested', 'refund_approved', 'refund_rejected'].includes(notification.type)) {
        if (isCustomer && validOrderId) {
          this.router.navigate(['/user/orders', relatedId]);
          return;
        }

        if (isCustomer) {
          this.router.navigateByUrl('/user/orders/list');
          return;
        }

        if (isAdmin) {
          const query = validOrderId
            ? `?orderId=${encodeURIComponent(relatedId)}`
            : '';
          this.router.navigateByUrl(`/admin/orders${query}`);
          return;
        }
      }

      if (notification.type === 'order_status_changed') {
        if (isCustomer && validOrderId) {
          this.router.navigate(['/user/orders', relatedId]);
          return;
        }

        if (isCustomer) {
          this.router.navigateByUrl('/user/orders/list');
          return;
        }
      }

      if (notification.type === 'birthday') {
        this.router.navigateByUrl(isAdmin ? '/admin/dashboard' : '/');
        return;
      }

      this.router.navigateByUrl(isAdmin ? '/admin/notifications' : '/user/notifications');
    };

    if (notification.isRead) {
      openTarget();
      return;
    }

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
        openTarget();
      },
      error: () => openTarget(),
    });
  }

  deleteNotification(notification: Notification, event?: MouseEvent): void {
    event?.stopPropagation();

    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        if (!notification.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications = this.notifications.filter((item) => item._id !== notification._id);
        this.cdr.detectChanges();
      },
    });
  }

  markAllAsRead(): void {
    this.notificationService
      .markAllAsRead()
      .subscribe({
        next: () => {
          this.notifications.forEach(
            (n) => (n.isRead = true)
          );

          this.unreadCount = 0;

          this.cdr.detectChanges();
        },
      });
  }

  icon(type: Notification['type']): string {
    const icons: Record<string, string> = {
      birthday: 'bi-gift',
      new_order: 'bi-bag-check',
      new_testimonial: 'bi-chat-quote',
      testimonial_approved: 'bi-check-circle',
      testimonial_declined: 'bi-x-circle',
      refund_requested: 'bi-arrow-return-left',
      refund_approved: 'bi-check-circle',
      refund_rejected: 'bi-x-circle',
      order_status_changed: 'bi-truck',
    };

    return icons[type] || 'bi-bell';
  }
}