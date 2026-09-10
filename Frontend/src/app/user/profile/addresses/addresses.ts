import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import { DeliveryLocation, OrderService } from '../../../core/services/order.service';
import { Address } from '../../../core/models/user.model';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [ConfirmDialog, ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './addresses.html',
  styleUrl: './addresses.css',
})
export class Addresses implements OnInit {
  addressForm: FormGroup;

  addresses: Address[] = [];

  deliveryLocations: DeliveryLocation[] = [];

  cities: string[] = [];

  deliveryFee: number | null = null;

  isLoading = true;

  isSaving = false;

  showForm = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  confirmOpen = false;

  pendingDeleteId: string | null = null;

  pendingDeleteLabel = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {
    this.addressForm = this.fb.group({
      label: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      governorate: ['', [Validators.required]],
    });
  }

  get label() {
    return this.addressForm.get('label');
  }

  get address() {
    return this.addressForm.get('address');
  }

  get governorate() {
    return this.addressForm.get('governorate');
  }

  get city() {
    return this.addressForm.get('city');
  }

  ngOnInit(): void {
    this.load();
    this.loadDeliveryLocations();
  }

  loadDeliveryLocations(): void {
    this.orderService.getDeliveryLocations().subscribe({
      next: (response) => {
        this.deliveryLocations = response.data || [];
        this.updateCities();
        this.cdr.detectChanges();
      },
      error: () => {
        this.deliveryLocations = [];
        this.cities = [];
        this.cdr.detectChanges();
      },
    });
  }

  updateCities(): void {
    const governorate = this.governorate?.value;
    const location = this.deliveryLocations.find(
      (item) => item.governorate === governorate,
    );

    this.cities = location?.cities.map((city) => city.name) || [];

    if (this.city?.value && !this.cities.includes(this.city.value)) {
      this.city?.setValue('');
    }

    this.updateDeliveryFee();
  }

  updateDeliveryFee(): void {
    const governorate = this.governorate?.value;
    const city = this.city?.value;
    const location = this.deliveryLocations.find(
      (item) => item.governorate === governorate,
    );

    this.deliveryFee =
      location?.cities.find((item) => item.name === city)?.fee ?? null;
  }

  load(): void {
    this.isLoading = true;

    this.userService.getMyAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data || [];
        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load addresses';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.addressForm.reset();
    this.cities = [];
    this.deliveryFee = null;

    this.cdr.detectChanges();
  }

  addAddress(): void {
    this.errorMessage = '';

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    this.userService.addAddress(this.addressForm.getRawValue()).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.addresses = response.data || [];
        this.showForm = false;
        this.addressForm.reset();

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.isSaving = false;

        this.errorMessage = error?.error?.message || 'Failed to add address';

        this.cdr.detectChanges();
      },
    });
  }

  setDefaultAddress(addr: Address): void {
    if (!addr._id || addr.isDefault) return;
    this.actionLoadingId = addr._id;
    this.errorMessage = '';
    this.userService.updateAddress(addr._id, { isDefault: true }).subscribe({
      next: (response) => {
        this.actionLoadingId = null;
        this.addresses = response.data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to set default address';
        this.cdr.detectChanges();
      },
    });
  }

  deleteAddress(addr: Address): void {
    if (!addr._id) {
      return;
    }

    this.pendingDeleteId = addr._id;
    this.pendingDeleteLabel = addr.label || 'this address';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteAddress(): void {
    const id = this.pendingDeleteId;
    this.pendingDeleteId = null;
    this.confirmOpen = false;

    if (!id) {
      return;
    }

    this.actionLoadingId = id;

    this.cdr.detectChanges();

    this.userService.deleteAddress(id).subscribe({
      next: (response) => {
        this.actionLoadingId = null;
        this.addresses = response.data || [];

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.actionLoadingId = null;

        this.errorMessage = err?.error?.message || 'Failed to delete address';

        this.cdr.detectChanges();
      },
    });
  }
  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }
}
