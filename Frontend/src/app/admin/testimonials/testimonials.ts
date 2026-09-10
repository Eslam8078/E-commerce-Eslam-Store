import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TestimonialService, ITestimonialQuery } from '../../core/services/testimonial.service';
import { Testimonial } from '../../core/models/testimonial.model';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.css',
})
export class Testimonials implements OnInit {
  testimonials: Testimonial[] = [];

  status: 'pending' = 'pending';

  page = 1;

  limit = 10;

  total = 0;

  totalPages = 0;

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  constructor(private testimonialService: TestimonialService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: ITestimonialQuery = {
      page: this.page,
      limit: this.limit,
      sort: 'createdAt',
      order: 'desc',
    };

    query.status = 'pending';
    query.isDeleted = false;

    this.testimonialService.getAllTestimonials(query).subscribe({
      next: (response) => {
        this.testimonials = response.data || [];
        this.total = response.pagination?.total ?? response.total ?? 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load testimonials';
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.load();
  }

  customerName(t: Testimonial): string {
    return typeof t.userId === 'object' && t.userId ? (t.userId as any).name : 'Customer';
  }

  stars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  setStatus(t: Testimonial, status: 'approved' | 'declined'): void {
    this.actionLoadingId = t._id;

    this.testimonialService.updateTestimonialStatus(t._id, status).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.testimonials = this.testimonials.filter((item) => item._id !== t._id);
        this.total = Math.max(0, this.total - 1);
        if (this.testimonials.length === 0 && this.page > 1) {
          this.page -= 1;
          this.load();
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update testimonial';
        this.cdr.detectChanges();
      },
    });
  }
}