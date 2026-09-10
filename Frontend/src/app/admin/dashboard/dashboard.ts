import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { DashboardService } from '../../core/services/report.service';
import { IRevenueReport, ITopProduct, ITopSaleProduct } from '../../core/models/report.model';
import { IProduct } from '../../core/models/product.model';
import { environment } from '../../../environment/env';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { DashboardStats } from './stats/stats';
import { ListNotifications } from './list-notifications/list-notifications';
import { ListTopProducts } from './list-top-products/list-top-products';
import { ListBestSellers } from './list-best-sellers/list-best-sellers';
import { ListNewArrivals } from './list-new-arrivals/list-new-arrivals';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, DashboardStats, ListNotifications, ListTopProducts, ListBestSellers, ListNewArrivals],
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
    this.notificationRefreshTimer = setInterval(() => this.loadNewOrderNotifications(), 10000);
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
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load revenue';
        this.cdr.detectChanges();
      },
    });

    this.dashboardService.getTopProducts({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (response) => {
        this.topProducts = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.topProducts = [];
        this.cdr.detectChanges();
      },
    });

    this.dashboardService.getTopSales(6).subscribe({
      next: (response) => {
        this.topSales = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.topSales = [];
        this.cdr.detectChanges();
      },
    });

    this.dashboardService.getNewArrivals(6).subscribe({
      next: (response) => {
        this.newArrivals = response.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.newArrivals = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadNewOrderNotifications(): void {
    this.notificationService.getMyNotifications({ limit: 10, sort: 'createdAt', order: 'desc' }).subscribe({
      next: (response) => {
        this.newOrderNotifications = (response.data || []).filter((notification) => notification.type === 'new_order');
        this.cdr.detectChanges();
      },
      error: () => {
        this.newOrderNotifications = [];
        this.cdr.detectChanges();
      },
    });
  }

  openOrderNotification(notification: Notification): void {
    const open = () => {
      this.router.navigate(['/admin/orders'], {
        queryParams: notification.relatedId ? { orderId: notification.relatedId } : undefined,
      });
    };

    this.newOrderNotifications = this.newOrderNotifications.filter((item) => item._id !== notification._id);
    this.cdr.detectChanges();

    if (notification.isRead) {
      open();
      return;
    }

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => open(),
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
}
