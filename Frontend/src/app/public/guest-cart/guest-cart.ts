import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { GuestCart, GuestCartItem } from '../../core/models/cart.model';
import { environment } from '../../../environment/env';

@Component({
  selector: 'app-guest-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './guest-cart.html',
  styleUrl: './guest-cart.css',
})
export class GuestCartComponent implements OnInit {
  cart: GuestCart = { items: [], totalPrice: 0 };
  readonly staticURL = environment.staticURL;
  message = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.cart = this.cartService.getGuestCart();
  }

  image(item: GuestCartItem): string {
    return item.image ? `${this.staticURL}${item.image}` : '';
  }

  updateQuantity(item: GuestCartItem, quantity: number): void {
    this.cartService.updateGuestCartItem(item.productId, quantity);
    this.load();
    this.cdr.detectChanges();
  }

  remove(item: GuestCartItem): void {
    this.cartService.removeFromGuestCart(item.productId);
    this.load();
    this.cdr.detectChanges();
  }

  clear(): void {
    this.cartService.clearGuestCart();
    this.load();
    this.cdr.detectChanges();
  }

  checkout(): void {
    if (!this.cart.items.length) {
      return;
    }

    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/user/checkout' },
    });
  }
}
