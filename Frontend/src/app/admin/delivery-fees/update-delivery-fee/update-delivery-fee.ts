import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryCity, DeliveryLocation, OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-update-delivery-fee',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './update-delivery-fee.html',
  styleUrl: './update-delivery-fee.css',
})
export class UpdateDeliveryFee implements OnInit {
  currentGovernorate = '';
  governorate = '';
  cities: DeliveryCity[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const governorate = this.route.snapshot.paramMap.get('governorate');
    if (!governorate) {
      this.router.navigate(['/admin/delivery-fees/list']);
      return;
    }

    this.currentGovernorate = governorate;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getDeliveryLocations().subscribe({
      next: (response) => {
        const location = (response.data || []).find(
          (item) => item.governorate.toLowerCase() === this.currentGovernorate.toLowerCase(),
        );

        if (!location) {
          this.errorMessage = 'Governorate not found';
        } else {
          this.governorate = location.governorate;
          this.cities = location.cities.map((city) => ({ ...city }));
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to load delivery location';
        this.cdr.detectChanges();
      },
    });
  }

  removeCity(index: number): void {
    this.cities.splice(index, 1);
  }

  addCityRow(): void {
    this.cities.push({ name: '', fee: 0 });
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.governorate = this.governorate.trim();

    if (!this.governorate || this.cities.some((city) => !city.name.trim() || !Number.isFinite(Number(city.fee)) || Number(city.fee) < 0)) {
      this.errorMessage = 'Enter a valid governorate, city names, and fees.';
      return;
    }

    this.saving = true;
    const cities = this.cities.map((city) => ({ name: city.name.trim(), fee: Number(city.fee) }));

    this.orderService.updateDeliveryLocation(this.currentGovernorate, this.governorate, cities).subscribe({
      next: (response) => {
        this.saving = false;
        this.successMessage = response.message || 'Delivery location updated successfully';
        this.currentGovernorate = response.data.governorate;
        this.router.navigate(['/admin/delivery-fees/list']);
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update delivery location';
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/delivery-fees/list']);
  }
}
