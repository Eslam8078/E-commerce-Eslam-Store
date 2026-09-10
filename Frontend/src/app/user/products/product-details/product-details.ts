import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

import { IProduct } from '../../../core/models/product.model';

import { environment } from '../../../../environment/env';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  product: IProduct | null = null;

  activeImage = '';

  quantity = 1;

  isLoading = true;

  errorMessage = '';

  addMessage = '';

  isAdding = false;

  readonly staticURL = environment.staticURL;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.errorMessage = 'Product not found';
      this.isLoading = false;

      this.cdr.detectChanges();

      return;
    }

    this.productService.getProductBySlug(slug).subscribe({
      next: (response) => {
        this.product = response.data;
        this.activeImage = this.image(this.product.images?.[0]);
        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Product not found';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  image(file: string | undefined): string {
    return file ? `${this.staticURL}${file}` : '';
  }

  categoryName(): string {
    if (!this.product) {
      return '';
    }

    return typeof this.product.categoryId === 'object' ? this.product.categoryId.name : '';
  }

  increaseQty(): void {
    if (this.product && this.quantity < this.product.stockQuantity) {
      this.quantity++;

      this.cdr.detectChanges();
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;

      this.cdr.detectChanges();
    }
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.isAdding = true;
    this.addMessage = '';

    this.cdr.detectChanges();

    this.cartService.addItem(this.product._id, this.quantity).subscribe({
      next: () => {
        this.isAdding = false;
        this.addMessage = 'Added to cart!';

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isAdding = false;

        this.addMessage = error?.error?.message || 'Failed to add to cart';

        this.cdr.detectChanges();
      },
    });
  }
}
