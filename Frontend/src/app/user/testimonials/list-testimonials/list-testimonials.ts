import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { TestimonialService } from '../../../core/services/testimonial.service';
import { Testimonial } from '../../../core/models/testimonial.model';

@Component({
  selector: 'app-list-testimonials',
  standalone: true,
  imports: [DatePipe, ConfirmDialog],
  templateUrl: './list-testimonials.html',
  styleUrl: './list-testimonials.css',
})
export class ListTestimonials implements OnInit {
  testimonials: Testimonial[] = [];

  isLoading = true;

  errorMessage = '';

  confirmOpen = false;
  pendingDelete: Testimonial | null = null;

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  constructor(
    private testimonialService: TestimonialService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.testimonialService
      .getMyTestimonials({
        page: this.page,
        limit: this.limit,
        sort: 'createdAt',
        order: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.testimonials = response.data || [];
          this.total = response.pagination?.total ?? response.total ?? 0;
          this.totalPages = response.pagination?.totalPages ?? response.pages ?? 1;
          this.page = response.pagination?.page ?? response.page ?? this.page;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load testimonials';
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

  stars(rating: number): number[] {
    return Array(rating).fill(0);
  }
  deleteTestimonial(t: Testimonial): void {
    this.pendingDelete = t;
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    const testimonial = this.pendingDelete;
    this.pendingDelete = null;
    this.confirmOpen = false;

    if (!testimonial?._id) {
      return;
    }

    this.testimonialService.deleteMyTestimonial(testimonial._id).subscribe({
      next: () => {
        if (this.testimonials.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.load();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to delete testimonial';
        this.cdr.detectChanges();
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDelete = null;
    this.cdr.detectChanges();
  }
}