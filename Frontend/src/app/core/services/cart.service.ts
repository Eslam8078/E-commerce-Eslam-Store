import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environment/env';

import {
  Cart,
  GuestCart,
  GuestCartItem,
} from '../models/cart.model';

import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiURL = `${environment.apiURL}/cart`;
  private readonly guestCartKey = 'guest_cart';
  private cartCountSubject = new BehaviorSubject<number>(this.getGuestCartCount());

  readonly cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(this.apiURL).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  addItem(productId: string, quantity = 1): Observable<ApiResponse<Cart>> {
    return this.http.post<ApiResponse<Cart>>(this.apiURL, {
      productId,
      quantity,
    }).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  updateItem(productId: string, quantity: number): Observable<ApiResponse<Cart>> {
    return this.http.patch<ApiResponse<Cart>>(`${this.apiURL}/${productId}`, {
      quantity,
    }).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  removeItem(productId: string): Observable<ApiResponse<Cart>> {
    return this.http.delete<ApiResponse<Cart>>(`${this.apiURL}/${productId}`).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  confirmPrice(productId: string): Observable<ApiResponse<Cart>> {
    return this.http.patch<ApiResponse<Cart>>(
      `${this.apiURL}/${productId}/confirm-price`,
      {},
    ).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  clearCart(): Observable<ApiResponse<Cart>> {
    return this.http.delete<ApiResponse<Cart>>(`${this.apiURL}/clear`).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  mergeGuestCart(items: GuestCartItem[]): Observable<ApiResponse<Cart>> {
    return this.http.post<ApiResponse<Cart>>(`${this.apiURL}/merge`, {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }).pipe(
      tap((response) => {
        this.cartCountSubject.next(this.getDatabaseCartCount(response.data));
      }),
    );
  }

  getGuestCart(): GuestCart {
    const raw = localStorage.getItem(this.guestCartKey);

    if (!raw) {
      return { items: [], totalPrice: 0 };
    }

    try {
      const cart = JSON.parse(raw) as GuestCart;

      if (!Array.isArray(cart.items)) {
        throw new Error('Invalid cart');
      }

      return {
        items: cart.items,
        totalPrice: this.calculateTotal(cart.items),
      };
    } catch {
      this.clearGuestCart();
      return { items: [], totalPrice: 0 };
    }
  }

  setGuestCart(cart: GuestCart): void {
    cart.totalPrice = this.calculateTotal(cart.items);
    localStorage.setItem(this.guestCartKey, JSON.stringify(cart));
    this.cartCountSubject.next(this.getGuestCartCount());
  }

  clearGuestCart(): void {
    localStorage.removeItem(this.guestCartKey);
    this.cartCountSubject.next(0);
  }

  addToGuestCart(
    product: {
      _id: string;
      name: string;
      slug: string;
      price: number;
      images: string[];
      stockQuantity: number;
    },
    quantity = 1,
  ): boolean {
    if (product.stockQuantity < 1 || quantity < 1) {
      return false;
    }

    const cart = this.getGuestCart();
    const existingItem = cart.items.find(
      (item) => String(item.productId) === String(product._id),
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + quantity,
        product.stockQuantity,
      );
      existingItem.name = product.name;
      existingItem.slug = product.slug;
      existingItem.price = product.price;
      existingItem.image = product.images?.[0];
      existingItem.stockQuantity = product.stockQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0],
        stockQuantity: product.stockQuantity,
        quantity: Math.min(quantity, product.stockQuantity),
      });
    }

    this.setGuestCart(cart);
    return true;
  }

  updateGuestCartItem(productId: string, quantity: number): void {
    const cart = this.getGuestCart();
    const item = cart.items.find(
      (cartItem) => String(cartItem.productId) === String(productId),
    );

    if (!item) {
      return;
    }

    if (quantity <= 0) {
      this.removeFromGuestCart(productId);
      return;
    }

    item.quantity = Math.min(quantity, item.stockQuantity);
    this.setGuestCart(cart);
  }

  removeFromGuestCart(productId: string): void {
    const cart = this.getGuestCart();

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== String(productId),
    );

    this.setGuestCart(cart);
  }

  getGuestCartCount(): number {
    if (typeof localStorage === 'undefined') {
      return 0;
    }

    const raw = localStorage.getItem(this.guestCartKey);

    if (!raw) {
      return 0;
    }

    try {
      const cart = JSON.parse(raw) as GuestCart;

      return Array.isArray(cart.items)
        ? cart.items.reduce((total, item) => total + Number(item.quantity || 0), 0)
        : 0;
    } catch {
      return 0;
    }
  }

  private getDatabaseCartCount(cart: Cart | null | undefined): number {
    return cart?.items?.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    ) || 0;
  }

  private calculateTotal(items: GuestCartItem[]): number {
    return items.reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0,
    );
  }
}
