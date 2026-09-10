import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { DashboardService } from '../../core/services/report.service';
import { TestimonialService } from '../../core/services/testimonial.service';

import { IProduct } from '../../core/models/product.model';
import { Testimonial } from '../../core/models/testimonial.model';

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

  bestSellers: IProduct[] = [];

  testimonials: Testimonial[] = [];

  isLoading = true;

  readonly staticURL = environment.staticURL;

  constructor(
    private dashboardService: DashboardService,
    private testimonialService: TestimonialService,
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

    this.dashboardService.getBestSellers(8).subscribe({
      next: (response) => {
        this.bestSellers = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => (this.bestSellers = []),
    });

    this.testimonialService.getApprovedTestimonials({ limit: 6 }).subscribe({
      next: (response) => {
        this.testimonials = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.testimonials = [];
        this.cdr.detectChanges();
      },
    });
  }

  image(images: string[] | undefined): string {
    if (!images || images.length === 0) {
      return '';
    }

    return `${this.staticURL}${images[0]}`;
  }

  stars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  testimonialName(testimonial: Testimonial): string {
    return typeof testimonial.userId === "object"
      ? testimonial.userId.name
      : "Customer";
  }

  testimonialInitial(testimonial: Testimonial): string {
    return this.testimonialName(testimonial).charAt(0).toUpperCase() || "U";
  }
}
