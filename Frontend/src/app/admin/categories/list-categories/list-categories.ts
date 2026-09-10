import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

import { CategoryService } from '../../../core/services/category.service';
import { ICategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-list-categories',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialog],
  templateUrl: './list-categories.html',
  styleUrl: './list-categories.css',
})
export class ListCategories implements OnInit {
  categories: ICategory[] = [];

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  statusFilter: 'all' | 'active' | 'inactive' | 'deleted' = 'all';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  confirmOpen = false;
  pendingCategory: ICategory | null = null;

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAdminCategories({
      limit: this.limit,
      ...(this.statusFilter === 'all' ? { isDeleted: false } : {}),
      ...(this.statusFilter === 'active' ? { isDeleted: false, isActive: true } : {}),
      ...(this.statusFilter === 'inactive' ? { isDeleted: false, isActive: false } : {}),
      ...(this.statusFilter === 'deleted' ? { isDeleted: true } : {}),
      page: this.page,
      sort: 'createdAt',
      order: 'desc',
    }).subscribe({
      next: (response) => {
        this.categories = response.data || [];
        this.total = response.pagination?.total || response.total || 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load categories';
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.load();
  }

  applyFilter(): void {
    this.page = 1;
    this.load();
  }

  requestDelete(category: ICategory): void {
    this.pendingCategory = category;
    this.confirmOpen = true;
  }

  confirmDelete(): void {
    const category = this.pendingCategory;
    this.closeConfirm();
    if (!category) return;
    this.actionLoadingId = category._id;
    this.categoryService.deleteCategory(category._id).subscribe({
      next: () => { this.actionLoadingId = null; this.load(); },
      error: (error) => { this.actionLoadingId = null; this.errorMessage = error?.error?.message || 'Failed to delete category'; this.cdr.detectChanges(); },
    });
  }

  restore(category: ICategory): void {
    this.actionLoadingId = category._id;
    this.categoryService.restoreCategory(category._id).subscribe({
      next: () => { this.actionLoadingId = null; this.load(); },
      error: (error) => { this.actionLoadingId = null; this.errorMessage = error?.error?.message || 'Failed to restore category'; this.cdr.detectChanges(); },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingCategory = null;
  }

  toggleActive(category: ICategory): void {
    if (category.isDeleted) return;
    this.actionLoadingId = category._id;

    const action = category.isActive
      ? this.categoryService.deactivateCategory(category._id)
      : this.categoryService.activateCategory(category._id);

    action.subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.cdr.detectChanges();
        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update category';
        this.cdr.detectChanges();
      },
    });
  }
}