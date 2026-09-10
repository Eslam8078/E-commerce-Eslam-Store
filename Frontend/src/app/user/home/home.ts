import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/report.service';

import { IProduct } from '../../core/models/product.model';
import { ITopSaleProduct } from '../../core/models/report.model';

import { environment } from '../../../environment/env';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  newArrivals: IProduct[] = [];

  topSales: ITopSaleProduct[] = [];

  isLoading = true;

  readonly staticURL = environment.staticURL;

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getNewArrivals(8).subscribe({
      next: (response) => {
        this.newArrivals = response.data || [];

        this.cdr.detectChanges();
      },
      error: () => {
        this.newArrivals = [];

        this.cdr.detectChanges();
      },
    });

    this.dashboardService.getTopSales(8).subscribe({
      next: (response) => {
        this.topSales = response.data || [];
        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  image(images: string[] | undefined): string {
    return images && images.length
      ? `${this.staticURL}${images[0]}`
      : '';
  }
}