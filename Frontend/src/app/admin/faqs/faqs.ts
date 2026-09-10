import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FaqService } from '../../core/services/faq.service';
import { FAQ } from '../../core/models/faq.model';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [FormsModule, ConfirmDialog],
  templateUrl: './faqs.html',
  styleUrl: './faqs.css',
})
export class Faqs implements OnInit {
  faqs: FAQ[] = [];

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  showForm = false;

  editingId: string | null = null;

  isSaving = false;

  formError = '';

  statusFilter: 'all' | 'active' | 'inactive' | 'deleted' = 'all';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  confirmOpen = false;
  pendingDelete: FAQ | null = null;

  form = {
    question: '',
    answer: '',
  };

  constructor(
    private faqService: FaqService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.faqService.getAllFAQs({ page: this.page, limit: this.limit, sort: 'createdAt', order: 'desc',
      ...(this.statusFilter === 'all' ? { isDeleted: false } : {}),
      ...(this.statusFilter === 'active' ? { isDeleted: false, isActive: true } : {}),
      ...(this.statusFilter === 'inactive' ? { isDeleted: false, isActive: false } : {}),
      ...(this.statusFilter === 'deleted' ? { isDeleted: true } : {}) }).subscribe({
      next: (response) => {
        this.faqs = response.data || [];
        this.total = response.pagination?.total || response.total || 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load FAQs';
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.load();
  }

  startAdd(): void {
    this.editingId = null;
    this.form = { question: '', answer: '' };
    this.formError = '';
    this.showForm = true;
  }

  startEdit(faq: FAQ): void {
    if (faq.isDeleted) {
      return;
    }

    this.editingId = faq._id;
    this.form = { question: faq.question, answer: faq.answer };
    this.formError = '';
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  submitForm(): void {
    this.formError = '';

    if (!this.form.question.trim() || !this.form.answer.trim()) {
      this.formError = 'Question and answer are required';
      return;
    }

    this.isSaving = true;

    const request = this.editingId
      ? this.faqService.updateFAQ(this.editingId, this.form)
      : this.faqService.createFAQ(this.form);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.editingId = null;
        this.page = 1;
        this.cdr.detectChanges();
        this.load();
      },
      error: (error) => {
        this.isSaving = false;
        this.formError = error?.error?.message || 'Failed to save FAQ';
        this.cdr.detectChanges();
      },
    });
  }

  toggleActive(faq: FAQ): void {
    if (faq.isDeleted) {
      return;
    }

    this.actionLoadingId = faq._id;

    const action = faq.isActive
      ? this.faqService.deactivateFAQ(faq._id)
      : this.faqService.activateFAQ(faq._id);

    action.subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update FAQ';
        this.cdr.detectChanges();
      },
    });
  }

  requestDelete(faq: FAQ): void {
    this.pendingDelete = faq;
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    const faq = this.pendingDelete;
    this.closeConfirm();

    if (!faq) {
      return;
    }

    this.actionLoadingId = faq._id;

    this.faqService.deleteFAQ(faq._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to delete FAQ';
        this.cdr.detectChanges();
      },
    });
  }

  restore(faq: FAQ): void {
    this.actionLoadingId = faq._id;

    this.faqService.restoreFAQ(faq._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to restore FAQ';
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