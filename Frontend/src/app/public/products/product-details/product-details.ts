import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { IProduct } from '../../../core/models/product.model';
import { environment } from '../../../../environment/env';

@Component({
  selector: 'app-public-product-details',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class PublicProductDetails implements OnInit {
  product: IProduct | null = null;
  activeImage = '';
  quantity = 1;
  isLoading = true;
  isAdding = false;
  errorMessage = '';
  addMessage = '';
  readonly staticURL = environment.staticURL;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.errorMessage = 'Product not found';
      this.isLoading = false;
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

    return typeof this.product.categoryId === 'object'
      ? this.product.categoryId.name
      : '';
  }

  increaseQty(): void {
    if (this.product && this.quantity < this.product.stockQuantity) {
      this.quantity++;
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product || this.product.stockQuantity < 1 || this.isAdding) {
      return;
    }

    this.isAdding = true;
    this.addMessage = '';
    this.errorMessage = '';

    if (!this.authService.isAuthenticated()) {
      const added = this.cartService.addToGuestCart(
        {
          _id: this.product._id,
          name: this.product.name,
          slug: this.product.slug,
          price: this.product.price,
          images: this.product.images,
          stockQuantity: this.product.stockQuantity,
        },
        this.quantity,
      );

      this.isAdding = false;

      if (added) {
        this.addMessage = 'Added to cart';
      } else {
        this.errorMessage = 'Unable to add this product to cart';
      }

      this.cdr.detectChanges();
      return;
    }

    if (this.authService.isCustomer()) {
      this.cartService.addItem(this.product._id, this.quantity).subscribe({
        next: () => {
          this.isAdding = false;
          this.addMessage = 'Added to cart';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isAdding = false;
          this.errorMessage =
            error?.error?.message || 'Failed to add product to cart';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.isAdding = false;
    this.errorMessage = 'You cannot add products to cart';
    this.cdr.detectChanges();
  }

  openCart(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/user/cart']);
    } else {
      this.router.navigate(['/guest-cart']);
    }
  }
}
