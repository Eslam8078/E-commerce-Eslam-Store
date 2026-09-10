import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { DashboardService } from '../../core/services/report.service';

import { IRevenueReport, ITopProduct, ITopSaleProduct } from '../../core/models/report.model';
import { IProduct } from '../../core/models/product.model';

import { environment } from '../../../environment/env';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  fromDate = isoDaysAgo(30);

  toDate = isoDaysAgo(0);

  revenue: IRevenueReport | null = null;

  topProducts: ITopProduct[] = [];

  topSales: ITopSaleProduct[] = [];

  newArrivals: IProduct[] = [];

  newOrderNotifications: Notification[] = [];

  isLoading = true;

  errorMessage = '';

  private notificationRefreshTimer?: ReturnType<typeof setInterval>;

  readonly staticURL = environment.staticURL;

  constructor(
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.notificationRefreshTimer = setInterval(
      () => this.loadNewOrderNotifications(),
      10000,
    );
  }

  ngOnDestroy(): void {
    if (this.notificationRefreshTimer) {
      clearInterval(this.notificationRefreshTimer);
    }
  }

  loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.loadNewOrderNotifications();

    this.dashboardService.getRevenueReport(this.fromDate, this.toDate).subscribe({
      next: (response) => {
        this.revenue = response.data;
        this.cdr.detectChanges();
      },
      error: (error) => (this.errorMessage = error?.error?.message || 'Failed to load revenue'),
    });

    this.dashboardService
      .getTopProducts({ fromDate: this.fromDate, toDate: this.toDate })
      .subscribe({
        next: (response) => {
          this.topProducts = response.data || [];
          this.cdr.detectChanges();
        },
        error: () => (this.topProducts = []),
      });

    this.dashboardService.getTopSales(6).subscribe({
      next: (response) => (this.topSales = response.data || []),
      error: () => (this.topSales = []),
    });

    this.dashboardService.getNewArrivals(6).subscribe({
      next: (response) => {
        this.newArrivals = response.data || [];
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadNewOrderNotifications(): void {
    this.notificationService
      .getMyNotifications({ limit: 10, sort: 'createdAt', order: 'desc' })
      .subscribe({
        next: (response) => {
          this.newOrderNotifications = (response.data || []).filter(
            (notification) => notification.type === 'new_order',
          );
          this.cdr.detectChanges();
        },
        error: () => {
          this.newOrderNotifications = [];
        },
      });
  }

  openOrderNotification(notification: Notification): void {
    const open = () => {
      const query = notification.relatedId
        ? { orderId: notification.relatedId }
        : null;

      this.router.navigate(['/admin/orders'], { queryParams: query || undefined });
    };

    if (notification.isRead) {
      this.newOrderNotifications = this.newOrderNotifications.filter(
        (item) => item._id !== notification._id,
      );
      this.cdr.detectChanges();
      open();
      return;
    }

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.isRead = true;
        this.cdr.detectChanges();
        open();
      },
      error: () => open(),
    });
  }

  applyDateFilter(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'The start date cannot be after the end date.';
      this.cdr.detectChanges();
      return;
    }

    this.loadAll();
  }

  image(images: string[]): string {
    return images && images.length ? `${this.staticURL}${images[0]}` : '';
  }
}
