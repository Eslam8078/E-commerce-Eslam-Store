import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

import { Cart } from '../../core/models/cart.model';
import { Address } from '../../core/models/user.model';

import { environment } from '../../../environment/env';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  cart: Cart | null = null;

  addresses: Address[] = [];

  selectedAddressId = '';

  deliveryFee = 0;

  checkoutTotal = 0;

  isLoading = true;

  isPlacingOrder = false;

  errorMessage = '';

  missingProfileFields = false;

  readonly staticURL = environment.staticURL;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart = response.data;

        if (!this.cart || this.cart.items.length === 0) {
          this.router.navigate(['/user/cart']);
          return;
        }

        if (this.cart.items.some((item) => item.isPriceChanged)) {
          this.router.navigate(['/user/cart']);
          return;
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to load cart';

        this.cdr.detectChanges();
      },
    });

    this.userService.getMyAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data || [];

        if (this.addresses.length > 0) {
          const defaultAddress = this.addresses.find((address) => address.isDefault && !address.isDeleted);
          this.selectedAddressId = (defaultAddress || this.addresses[0])._id || '';
          this.loadQuote();
        }

        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;

        this.errorMessage =
          error?.error?.message || 'Failed to load addresses';

        this.cdr.detectChanges();
      },
    });

    this.authService.getMe().subscribe({
      next: (response) => {
        const user = response.data;

        this.missingProfileFields =
          !user.nationalId || !user.mobilePhone;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Failed to load user profile';

        this.cdr.detectChanges();
      },
    });
  }

  loadQuote(): void {
    if (!this.selectedAddressId) return;

    this.orderService.getOrderQuote(this.selectedAddressId).subscribe({
      next: (response) => {
        this.deliveryFee = response.data.deliveryFee;
        this.checkoutTotal = response.data.totalPrice;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.deliveryFee = 0;
        this.checkoutTotal = 0;
        this.errorMessage = error?.error?.message || 'Failed to calculate delivery fee';
        this.cdr.detectChanges();
      },
    });
  }

  productName(item: Cart['items'][number]): string {
    return typeof item.productId === 'object'
      ? item.productId.name
      : 'Product';
  }

  placeOrder(): void {
    if (this.missingProfileFields) {
      this.errorMessage =
        'Please add your national ID and mobile phone before placing an order';

      this.cdr.detectChanges();

      return;
    }

    if (!this.selectedAddressId) {
      this.errorMessage =
        'Please select or add a delivery address';

      this.cdr.detectChanges();

      return;
    }

    this.isPlacingOrder = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.orderService.createOrder(this.selectedAddressId).subscribe({
      next: (response) => {
        this.isPlacingOrder = false;

        this.cdr.detectChanges();

        this.router.navigate([
          '/user/orders',
          response.data._id,
        ]);
      },
      error: (error) => {
        this.isPlacingOrder = false;

        this.errorMessage =
          error?.error?.message || 'Failed to place order';

        this.cdr.detectChanges();
      },
    });
  }
}