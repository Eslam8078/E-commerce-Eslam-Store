import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { FaqService } from '../../core/services/faq.service';

import { FAQ } from '../../core/models/faq.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq implements OnInit {
  faqs: FAQ[] = [];

  isLoading = true;

  errorMessage = '';

  openId: string | null = null;

  constructor(
    private faqService: FaqService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.faqService
      .getActiveFAQs({
        limit: 50,
        sort: 'createdAt',
        order: 'asc',
      })
      .subscribe({
        next: (response) => {
          this.faqs = response.data || [];
          this.isLoading = false;

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load FAQs';

          this.isLoading = false;

          this.cdr.detectChanges();
        },
      });
  }

  toggle(id: string): void {
    this.openId = this.openId === id ? null : id;

    this.cdr.detectChanges();
  }
}
