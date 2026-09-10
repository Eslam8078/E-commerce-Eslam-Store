import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { ProductService, IProductQuery } from '../../../core/services/product.service';

import { CategoryService } from '../../../core/services/category.service';
import { CartService } from '../../../core/services/cart.service';

import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { ISubCategory } from '../../../core/models/subcategory.model';
import { SubCategoryService } from '../../../core/services/subcategory.service';

import { environment } from '../../../../environment/env';

@Component({
  selector: 'app-list-products',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './list-products.html',
  styleUrl: './list-products.css',
})
export class ListProducts implements OnInit {
  products: IProduct[] = [];

  categories: ICategory[] = [];

  search = '';

  categoryId = '';
  subCategoryId = '';
  season = '';
  subcategories: ISubCategory[] = [];

  page = 1;

  totalPages = 0;

  isLoading = true;

  errorMessage = '';
  successMessage = '';

  readonly staticURL = environment.staticURL;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private subcategoryService: SubCategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories({ limit: 50 }).subscribe({
      next: (response) => {
        this.categories = response.data || [];

        this.cdr.detectChanges();
      },
      error: () => {
        this.categories = [];

        this.cdr.detectChanges();
      },
    });

    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.cdr.detectChanges();

    const query: IProductQuery = {
      page: this.page,
      limit: 12,
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

    if (this.season) {
      query.season = this.season;
    }

    this.productService.getProducts(query).subscribe({
      next: (response) => {
        this.products = response.data || [];
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load products';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  onCategoryChange(): void {
    this.subCategoryId = '';
    this.subcategories = [];
    this.page = 1;

    if (!this.categoryId) {
      this.load();
      return;
    }

    this.subcategoryService.getSubCategories({ categoryId: this.categoryId, limit: 100 }).subscribe({
      next: (response) => {
        this.subcategories = response.data || [];
        this.cdr.detectChanges();
        this.load();
      },
      error: () => this.load(),
    });
  }

  onFilterChange(): void {
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

  image(images: string[]): string {
    return images && images.length ? `${this.staticURL}${images[0]}` : '';
  }

  addToCart(event: Event, product: IProduct): void {
    event.preventDefault();
    event.stopPropagation();

    if (!product.isActive || product.isDeleted || product.stockQuantity < 1) {
      this.errorMessage = 'This product is not available';
      return;
    }

    this.errorMessage = '';
    this.cartService.addItem(product._id, 1).subscribe({
      next: () => {
        this.successMessage = `${product.name} added to cart`;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to add product to cart';
        this.cdr.detectChanges();
      },
    });
  }

}
