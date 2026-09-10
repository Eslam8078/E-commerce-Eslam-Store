import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [ReactiveFormsModule],

  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  isLoading = false;

  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        const role = response.data.user.role;
        if (role === 'customer') {
          const guestCart = this.cartService.getGuestCart();

          if (guestCart.items.length) {
            this.cartService.mergeGuestCart(guestCart.items).subscribe({
              next: () => {
                this.cartService.clearGuestCart();
                this.isLoading = false;
                this.router.navigateByUrl('/');
              },
              error: () => {
                this.isLoading = false;
                this.errorMessage = 'Login succeeded, but the guest cart could not be merged';
                this.router.navigateByUrl('/');
              },
            });
            return;
          }

          this.isLoading = false;
          this.router.navigateByUrl('/');
          return;
        }

        this.isLoading = false;

        if (role === 'admin') {
          this.router.navigate(['/admin']);
          return;
        }

        this.authService.logout();
        this.errorMessage = 'Invalid user role';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || 'Invalid email or password';
        this.cdr.detectChanges();
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
