import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { DeliveryCity, DeliveryLocation, OrderService } from '../../../core/services/order.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-list-delivery-fees',
  standalone: true,
  imports: [RouterLink, ConfirmDialog, DecimalPipe],
  templateUrl: './list-delivery-fees.html',
  styleUrl: './list-delivery-fees.css',
})
export class ListDeliveryFees implements OnInit {
  locations: DeliveryLocation[] = [];
  loading = true;
  errorMessage = '';
  actionKey = '';
  confirmOpen = false;
  pendingDelete: { type: 'governorate' | 'city'; governorate: string; city?: string } | null = null;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getDeliveryLocations().subscribe({
      next: (response) => {
        this.locations = response.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to load delivery locations';
        this.cdr.detectChanges();
      },
    });
  }

  requestDeleteGovernorate(location: DeliveryLocation): void {
    this.pendingDelete = { type: 'governorate', governorate: location.governorate };
    this.confirmOpen = true;
  }

  requestDeleteCity(location: DeliveryLocation, city: DeliveryCity): void {
    this.pendingDelete = {
      type: 'city',
      governorate: location.governorate,
      city: city.name,
    };
    this.confirmOpen = true;
  }

  confirmDelete(): void {
    const pending = this.pendingDelete;
    this.closeConfirm();
    if (!pending) return;

    this.actionKey = pending.type === 'governorate'
      ? `governorate:${pending.governorate}`
      : `city:${pending.governorate}:${pending.city}`;

    const request = pending.type === 'governorate'
      ? this.orderService.deleteGovernorate(pending.governorate)
      : this.orderService.deleteDeliveryCity(pending.governorate, pending.city || '');

    request.subscribe({
      next: () => {
        this.actionKey = '';
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.actionKey = '';
        this.errorMessage = error.error?.message || 'Failed to delete delivery location';
        this.cdr.detectChanges();
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDelete = null;
  }

  isDeletingGovernorate(location: DeliveryLocation): boolean {
    return this.actionKey === `governorate:${location.governorate}`;
  }

  isDeletingCity(location: DeliveryLocation, city: DeliveryCity): boolean {
    return this.actionKey === `city:${location.governorate}:${city.name}`;
  }
}
