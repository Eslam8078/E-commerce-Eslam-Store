import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductService, IProductQuery } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubCategoryService } from '../../../core/services/subcategory.service';

import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { ISubCategory } from '../../../core/models/subcategory.model';

import { environment } from '../../../../environment/env';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-list-products',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, ConfirmDialog],
  templateUrl: './list-products.html',
  styleUrl: './list-products.css',
})
export class ListProducts implements OnInit {
  products: IProduct[] = [];

  categories: ICategory[] = [];

  subcategories: ISubCategory[] = [];

  search = '';

  categoryId = '';

  subCategoryId = '';

  season = '';
  statusFilter: 'all' | 'active' | 'inactive' | 'deleted' = 'all';

  sort = 'createdAt';

  order: 'asc' | 'desc' = 'desc';

  page = 1;

  limit = 10;

  total = 0;

  totalPages = 0;

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  confirmOpen = false;
  confirmAction: 'delete' | 'activate-season' | 'deactivate-season' | null = null;
  pendingSeason = '';
  pendingProduct: IProduct | null = null;

  readonly staticURL = environment.staticURL;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private subcategoryService: SubCategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getAdminCategories({ limit: 100, includeDeleted: true }).subscribe({
      next: (response) => (this.categories = response.data || []),
      error: () => (this.categories = []),
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: IProductQuery = {
      page: this.page,
      limit: this.limit,
      sort: this.sort,
      order: this.order,
      ...(this.statusFilter === 'all' ? { isDeleted: false, includeInactive: true } : {}),
      ...(this.statusFilter === 'active' ? { isDeleted: false, isActive: true } : {}),
      ...(this.statusFilter === 'inactive' ? { isDeleted: false, isActive: false } : {}),
      ...(this.statusFilter === 'deleted' ? { isDeleted: true } : {}),
      season: this.season || undefined,
    };

    if (this.search.trim()) {
      query.search = this.search.trim();
    }

    if (this.categoryId) {
      query.categoryId = this.categoryId;
    }

    if (this.subCategoryId) {
      query.subCategoryId = this.subCategoryId;
    }

    this.productService.getAdminProducts(query).subscribe({
      next: (response) => {
        this.products = response.data || [];
        this.total = response.pagination?.total ?? response.total ?? 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.page = response.pagination?.page ?? response.page ?? this.page;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load products';
        this.cdr.detectChanges();
      },
    });
  }

  onCategoryChange(): void {
    this.subCategoryId = '';
    this.subcategories = [];
    this.page = 1;

    if (!this.categoryId) {
      this.loadProducts();
      return;
    }

    this.subcategoryService
      .getAdminSubCategories({ categoryId: this.categoryId, limit: 100, includeDeleted: true })
      .subscribe({
        next: (response) => {
          this.subcategories = response.data || [];
          this.cdr.detectChanges();
          this.loadProducts();
        },
        error: () => this.loadProducts(),
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.search = '';
    this.categoryId = '';
    this.subCategoryId = '';
    this.season = '';
    this.statusFilter = 'all';
    this.subcategories = [];
    this.sort = 'createdAt';
    this.order = 'desc';
    this.page = 1;
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.loadProducts();
  }

  image(images: string[]): string {
    return images && images.length ? `${this.staticURL}${images[0]}` : '';
  }

  categoryName(categoryId: IProduct['categoryId']): string {
    if (typeof categoryId === 'string') {
      return categoryId;
    }
    return categoryId?.name || '-';
  }

  toggleNewArrival(product: IProduct): void {
    if (!product._id || product.isDeleted) return;
    this.actionLoadingId = product._id;

    this.productService.toggleNewArrival(product._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.loadProducts();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update new arrival status';
        this.cdr.detectChanges();
      },
    });
  }

  toggleBestSeller(product: IProduct): void {
    if (!product._id || product.isDeleted) return;
    this.actionLoadingId = product._id;
    this.productService.toggleBestSeller(product._id).subscribe({
      next: () => { this.actionLoadingId = null; this.loadProducts(); },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update best seller status';
        this.cdr.detectChanges();
      },
    });
  }

  toggleActive(product: IProduct): void {
    if (!product._id) {
      return;
    }

    this.actionLoadingId = product._id;

    const action = product.isActive
      ? this.productService.deactivateProduct(product._id)
      : this.productService.activateProduct(product._id);

    action.subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.loadProducts();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update product status';
        this.cdr.detectChanges();
      },
    });
  }

  deactivateSeason(): void {
    if (!this.season) {
      return;
    }

    this.pendingSeason = this.season;
    this.confirmAction = 'deactivate-season';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeactivateSeason(): void {
    const season = this.pendingSeason;

    this.pendingSeason = '';
    this.confirmAction = null;
    this.confirmOpen = false;

    if (!season) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.productService.deactivateSeasonProducts(season).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loadProducts();
        this.errorMessage = response.data?.modifiedCount === 0
          ? `No active products found for ${this.season}.`
          : `${response.data.modifiedCount} ${this.season} product(s) deactivated.`;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to deactivate season products';
        this.cdr.detectChanges();
      },
    });
  }

  deleteProduct(product: IProduct): void {
    if (!product._id) {
      return;
    }

    this.pendingProduct = product;
    this.confirmAction = 'delete';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteProduct(): void {
    const product = this.pendingProduct;

    this.pendingProduct = null;
    this.confirmAction = null;
    this.confirmOpen = false;

    if (!product?._id) {
      return;
    }

    this.actionLoadingId = product._id;

    this.productService.deleteProduct(product._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.loadProducts();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to delete product';
        this.cdr.detectChanges();
      },
    });
  }
  restoreProduct(product: IProduct): void {
    if (!product._id) {
      return;
    }

    this.actionLoadingId = product._id;

    this.productService.restoreProduct(product._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.loadProducts();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to restore product';
        this.cdr.detectChanges();
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.confirmAction = null;
    this.pendingProduct = null;
    this.pendingSeason = '';
    this.cdr.detectChanges();
  }

  activateSeason(): void {
    if (!this.season) {
      return;
    }

    this.pendingSeason = this.season;
    this.confirmAction = 'activate-season';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmActivateSeason(): void {
    const season = this.pendingSeason;

    this.pendingSeason = '';
    this.confirmAction = null;
    this.confirmOpen = false;

    if (!season) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.productService.activateSeasonProducts(season).subscribe({
      next: (response: { message: string; data: { season: string; modifiedCount: number } }) => {
        this.isLoading = false;
        this.loadProducts();
        this.errorMessage = response.data?.modifiedCount === 0
          ? `No inactive products found for ${season}.`
          : `${response.data.modifiedCount} ${season} product(s) activated.`;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to activate season products';
        this.cdr.detectChanges();
      },
    });
  }

  get confirmTitle(): string {
    if (this.confirmAction === 'activate-season') {
      return 'Activate season products';
    }

    if (this.confirmAction === 'deactivate-season') {
      return 'Deactivate season products';
    }

    return 'Delete product';
  }

  get confirmMessage(): string {
    if (this.confirmAction === 'deactivate-season') {
      return `Deactivate all active ${this.pendingSeason} products?`;
    }

    if (this.confirmAction === 'activate-season') {
      return `Activate all inactive ${this.pendingSeason} products?`;
    }

    return this.pendingProduct ? `Delete "${this.pendingProduct.name}"?` : 'Delete this product?';
  }

  get confirmButtonText(): string {
    if (this.confirmAction === 'activate-season') {
      return 'Activate all';
    }

    if (this.confirmAction === 'deactivate-season') {
      return 'Deactivate all';
    }

    return 'Delete';
  }
}
