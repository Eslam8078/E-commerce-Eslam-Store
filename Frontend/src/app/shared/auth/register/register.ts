
import { ChangeDetectorRef, Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

import { IRegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [ReactiveFormsModule],

  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;

  isLoading = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],

      email: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required, Validators.minLength(6)]],

      gender: ['', [Validators.required]],

      mobilePhone: ['', [Validators.pattern(/^01[0125][0-9]{8}$/)]],

      nationalId: ['', [Validators.pattern(/^[0-9]{14}$/)]],

      DOB: ['', [Validators.required]],
    });
  }

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get gender() {
    return this.registerForm.get('gender');
  }

  get mobilePhone() {
    return this.registerForm.get('mobilePhone');
  }

  get nationalId() {
    return this.registerForm.get('nationalId');
  }

  get DOB() {
    return this.registerForm.get('DOB');
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formValue = this.registerForm.getRawValue();

    const data: IRegisterRequest = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      gender: formValue.gender,
      DOB: formValue.DOB,
      ...(formValue.mobilePhone
        ? { mobilePhone: formValue.mobilePhone }
        : {}),
      ...(formValue.nationalId
        ? { nationalId: formValue.nationalId }
        : {}),
    };

    this.authService.register(data).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Registered successfully';

        const guestCart = this.cartService.getGuestCart();

        if (guestCart.items.length) {
          this.cartService.mergeGuestCart(guestCart.items).subscribe({
            next: () => {
              this.cartService.clearGuestCart();
              this.finishRegistration();
            },
            error: () => {
              this.finishRegistration();
            },
          });
          return;
        }

        this.finishRegistration();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || 'Registration failed';
        this.cdr.detectChanges();
      },
    });
  }

  private finishRegistration(): void {
    this.isLoading = false;

    setTimeout(() => {
      this.router.navigate(['/user']);
    }, 300);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
