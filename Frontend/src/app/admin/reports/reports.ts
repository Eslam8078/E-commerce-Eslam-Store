import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { DashboardService } from '../../core/services/report.service';
import {
  IRevenueReport,
  ITopProduct,
  IOrdersByStatus,
  ISalesByDate,
  ISalesByGovernorate,
} from '../../core/models/report.model';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  fromDate = isoDaysAgo(90);

  toDate = isoDaysAgo(0);

  revenue: IRevenueReport | null = null;

  topProducts: ITopProduct[] = [];

  ordersByStatus: IOrdersByStatus[] = [];

  salesByDate: ISalesByDate[] = [];

  salesByGovernorate: ISalesByGovernorate[] = [];

  isLoading = false;

  errorMessage = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.generate();
  }

  generate(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'The start date cannot be after the end date.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      revenue: this.dashboardService.getRevenueReport(this.fromDate, this.toDate),
      topProducts: this.dashboardService.getTopProducts({ fromDate: this.fromDate, toDate: this.toDate }),
      ordersByStatus: this.dashboardService.getOrdersByStatus({ fromDate: this.fromDate, toDate: this.toDate }),
      salesByDate: this.dashboardService.getSalesByDate({ fromDate: this.fromDate, toDate: this.toDate }),
      salesByGovernorate: this.dashboardService.getSalesByGovernorate({ fromDate: this.fromDate, toDate: this.toDate }),
    }).subscribe({
      next: (result) => {
        this.revenue = result.revenue.data;
        this.topProducts = result.topProducts.data || [];
        this.ordersByStatus = result.ordersByStatus.data || [];
        this.salesByDate = result.salesByDate.data || [];
        this.salesByGovernorate = result.salesByGovernorate.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load report';
        this.cdr.detectChanges();
      },
    });
  }

  printReport(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'The start date cannot be after the end date.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      revenue: this.dashboardService.getRevenueReport(this.fromDate, this.toDate),
      topProducts: this.dashboardService.getTopProducts({ fromDate: this.fromDate, toDate: this.toDate }),
      ordersByStatus: this.dashboardService.getOrdersByStatus({ fromDate: this.fromDate, toDate: this.toDate }),
      salesByDate: this.dashboardService.getSalesByDate({ fromDate: this.fromDate, toDate: this.toDate }),
      salesByGovernorate: this.dashboardService.getSalesByGovernorate({ fromDate: this.fromDate, toDate: this.toDate }),
    }).subscribe({
      next: (result) => {
        this.revenue = result.revenue.data;
        this.topProducts = result.topProducts.data || [];
        this.ordersByStatus = result.ordersByStatus.data || [];
        this.salesByDate = result.salesByDate.data || [];
        this.salesByGovernorate = result.salesByGovernorate.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => window.print(), 0);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to prepare report for printing';
        this.cdr.detectChanges();
      },
    });
  }

  get averageOrderValue(): number {
    if (!this.revenue || !this.revenue.totalOrders) {
      return 0;
    }
    return this.revenue.totalRevenue / this.revenue.totalOrders;
  }
}
