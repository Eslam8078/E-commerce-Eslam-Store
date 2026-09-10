import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DeliveryLocation, OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-add-delivery-fee',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-delivery-fee.html',
  styleUrl: './add-delivery-fee.css',
})
export class AddDeliveryFee implements OnInit {
  locations: DeliveryLocation[] = [];
  governorateLoading = false;
  cityLoading = false;
  errorMessage = '';
  successMessage = '';

  governorateForm!: FormGroup;
  cityForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.governorateForm = this.fb.nonNullable.group({
      governorate: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    });

    this.cityForm = this.fb.nonNullable.group({
      governorate: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      fee: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.orderService.getDeliveryLocations().subscribe({
      next: (response) => {
        this.locations = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load delivery locations';
        this.cdr.detectChanges();
      },
    });
  }

  addGovernorate(): void {
    this.resetMessages();
    if (this.governorateForm.invalid) {
      this.governorateForm.markAllAsTouched();
      return;
    }

    const governorate = this.governorateForm.getRawValue().governorate.trim();
    this.governorateLoading = true;

    this.orderService.addGovernorate(governorate).subscribe({
      next: (response) => {
        this.governorateLoading = false;
        this.successMessage = response.message || 'Governorate added successfully';
        this.governorateForm.reset({ governorate: '' });
        this.loadLocations();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.governorateLoading = false;
        this.errorMessage = error.error?.message || 'Failed to add governorate';
        this.cdr.detectChanges();
      },
    });
  }

  addCity(): void {
    this.resetMessages();
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched();
      return;
    }

    const value = this.cityForm.getRawValue();
    this.cityLoading = true;

    this.orderService.addDeliveryCity(value.governorate, value.name.trim(), Number(value.fee)).subscribe({
      next: (response) => {
        this.cityLoading = false;
        this.successMessage = response.message || 'City added successfully';
        this.cityForm.patchValue({ name: '', fee: 0 });
        this.loadLocations();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.cityLoading = false;
        this.errorMessage = error.error?.message || 'Failed to add city';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/delivery-fees/list']);
  }

  private resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
