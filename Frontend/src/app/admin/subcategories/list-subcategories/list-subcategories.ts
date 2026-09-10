import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

import { SubCategoryService } from '../../../core/services/subcategory.service';
import { ISubCategory } from '../../../core/models/subcategory.model';

@Component({
  selector: 'app-list-subcategories',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialog],
  templateUrl: './list-subcategories.html',
  styleUrl: './list-subcategories.css',
})
export class ListSubcategories implements OnInit {
  subcategories: ISubCategory[] = [];

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  statusFilter: 'all' | 'active' | 'inactive' | 'deleted' = 'all';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  confirmOpen = false;
  pendingSubCategory: ISubCategory | null = null;

  constructor(
    private subcategoryService: SubCategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subcategoryService.getAdminSubCategories({
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
        this.subcategories = response.data || [];
        this.total = response.pagination?.total || response.total || 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load subcategories';
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

  categoryName(subcategory: ISubCategory): string {
    const categoryId = subcategory.categoryId as any;
    if (categoryId && typeof categoryId === 'object') {
      return categoryId.name || '-';
    }
    return '-';
  }

  requestDelete(subcategory: ISubCategory): void {
    this.pendingSubCategory = subcategory;
    this.confirmOpen = true;
  }

  confirmDelete(): void {
    const subcategory = this.pendingSubCategory;
    this.closeConfirm();
    if (!subcategory) return;
    this.actionLoadingId = subcategory._id;
    this.subcategoryService.deleteSubCategory(subcategory._id).subscribe({
      next: () => { this.actionLoadingId = null; this.load(); },
      error: (error) => { this.actionLoadingId = null; this.errorMessage = error?.error?.message || 'Failed to delete subcategory'; this.cdr.detectChanges(); },
    });
  }

  restore(subcategory: ISubCategory): void {
    this.actionLoadingId = subcategory._id;
    this.subcategoryService.restoreSubCategory(subcategory._id).subscribe({
      next: () => { this.actionLoadingId = null; this.load(); },
      error: (error) => { this.actionLoadingId = null; this.errorMessage = error?.error?.message || 'Failed to restore subcategory'; this.cdr.detectChanges(); },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingSubCategory = null;
  }

  toggleActive(subcategory: ISubCategory): void {
    if (subcategory.isDeleted) return;
    this.actionLoadingId = subcategory._id;

    const action = subcategory.isActive
      ? this.subcategoryService.deactivateSubCategory(subcategory._id)
      : this.subcategoryService.activateSubCategory(subcategory._id);

    action.subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update subcategory';
        this.cdr.detectChanges();
      },
    });
  }
}
