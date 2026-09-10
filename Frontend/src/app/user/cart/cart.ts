import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { CartService } from '../../core/services/cart.service';
import { Cart as CartModel, CartItem } from '../../core/models/cart.model';

import { environment } from '../../../environment/env';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ConfirmDialog],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cart: CartModel | null = null;

  isLoading = true;

  errorMessage = '';

  actionLoadingId: string | null = null;

  confirmOpen = false;

  readonly staticURL = environment.staticURL;

  constructor(
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart = response.data;
        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to load cart';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  productId(item: CartItem): string {
    return typeof item.productId === 'object'
      ? item.productId._id
      : item.productId;
  }

  productName(item: CartItem): string {
    return typeof item.productId === 'object'
      ? item.productId.name
      : 'Product';
  }

  productSlug(item: CartItem): string {
    return typeof item.productId === 'object'
      ? item.productId.slug
      : '';
  }

  productImage(item: CartItem): string {
    const images =
      typeof item.productId === 'object'
        ? item.productId.images
        : [];

    return images && images.length
      ? `${this.staticURL}${images[0]}`
      : '';
  }

  maxStock(item: CartItem): number {
    return typeof item.productId === 'object'
      ? item.productId.stockQuantity
      : 99;
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity > this.maxStock(item)) {
      return;
    }

    const id = this.productId(item);

    this.actionLoadingId = id;

    this.cartService.updateItem(id, quantity).subscribe({
      next: (response) => {
        this.cart = response.data;
        this.actionLoadingId = null;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;

        this.errorMessage =
          error?.error?.message || 'Failed to update quantity';

        this.cdr.detectChanges();
      },
    });
  }

  confirmPrice(item: CartItem): void {
    const id = this.productId(item);

    this.actionLoadingId = id;

    this.cartService.confirmPrice(id).subscribe({
      next: (response) => {
        this.cart = response.data;
        this.actionLoadingId = null;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;

        this.errorMessage =
          error?.error?.message || 'Failed to update price';

        this.cdr.detectChanges();
      },
    });
  }

  removeItem(item: CartItem): void {
    const id = this.productId(item);

    this.actionLoadingId = id;

    this.cartService.removeItem(id).subscribe({
      next: (response) => {
        this.cart = response.data;
        this.actionLoadingId = null;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;

        this.errorMessage =
          error?.error?.message || 'Failed to remove item';

        this.cdr.detectChanges();
      },
    });
  }

  clearCart(): void {
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.cdr.detectChanges();
  }

  confirmClearCart(): void {
    this.confirmOpen = false;

    this.cartService.clearCart().subscribe({
      next: (response) => {
        this.cart = response.data;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to clear cart';

        this.cdr.detectChanges();
      },
    });
  }

  goToCheckout(): void {
    if (this.hasPriceChanges()) {
      this.errorMessage =
        'Please confirm updated prices before checkout';

      this.cdr.detectChanges();

      return;
    }

    this.router.navigate(['/user/checkout']);
  }

  hasPriceChanges(): boolean {
    return !!this.cart?.items.some(
      (item) => item.isPriceChanged
    );
  }
}