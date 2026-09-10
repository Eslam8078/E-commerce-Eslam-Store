import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  profileForm: FormGroup;

  user: User | null = null;

  isLoading = true;

  isSaving = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      mobilePhone: ['', [Validators.pattern(/^01[0125][0-9]{8}$/)]],
      nationalId: ['', [Validators.pattern(/^\d{14}$/)]],
      gender: [''],
      DOB: [''],
    });
  }

  get name() {
    return this.profileForm.get('name');
  }

  get mobilePhone() {
    return this.profileForm.get('mobilePhone');
  }

  get nationalId() {
    return this.profileForm.get('nationalId');
  }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (response) => {
        this.user = response.data;

        this.profileForm.patchValue({
          name: this.user.name,
          mobilePhone: this.user.mobilePhone || '',
          nationalId: this.user.nationalId || '',
          gender: this.user.gender || '',
          DOB: this.user.DOB ? this.user.DOB.slice(0, 10) : '',
        });

        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load profile';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.profileForm.getRawValue();

    this.userService
      .updateMyProfile({
        name: formValue.name,
        ...(formValue.mobilePhone ? { mobilePhone: formValue.mobilePhone } : {}),
        ...(formValue.nationalId ? { nationalId: formValue.nationalId } : {}),
        ...(formValue.gender ? { gender: formValue.gender } : {}),
        ...(formValue.DOB ? { DOB: formValue.DOB } : {}),
      })
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.user = response.data;
          this.authService.setUser(response.data);

          this.successMessage = response.message || 'Profile updated successfully';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.isSaving = false;

          this.errorMessage = error?.error?.message || 'Failed to update profile';

          this.cdr.detectChanges();
        },
      });
  }
}
