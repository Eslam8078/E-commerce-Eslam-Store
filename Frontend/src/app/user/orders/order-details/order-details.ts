import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';

import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

import { environment } from '../../../../environment/env';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, ConfirmDialog],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails implements OnInit {
  order: Order | null = null;

  isLoading = true;

  errorMessage = '';

  isActing = false;

  confirmOpen = false;
  confirmAction: 'cancel' | 'refund' | null = null;

  readonly staticURL = environment.staticURL;

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Order not found';
      this.isLoading = false;

      this.cdr.detectChanges();

      return;
    }

    this.load(id);
  }

  load(id: string): void {
    this.orderService.getMyOrderById(id).subscribe({
      next: (response) => {
        this.order = response.data;
        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Order not found';

        this.isLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  productName(item: Order['items'][number]): string {
    return typeof item.productId === 'object' ? item.productId.name : 'Product';
  }

  productImage(item: Order['items'][number]): string {
    const images = typeof item.productId === 'object' ? item.productId.images : [];

    return images && images.length ? `${this.staticURL}${images[0]}` : '';
  }

  get canCancel(): boolean {
    return !!this.order && ['pending', 'preparing'].includes(this.order.orderStatus);
  }

  get canRefund(): boolean {
    return !!this.order && this.order.orderStatus === 'delivered';
  }

  cancelOrder(): void {
    if (!this.order) {
      return;
    }

    this.confirmAction = 'cancel';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmPendingAction(): void {
    const action = this.confirmAction;
    const order = this.order;

    this.confirmOpen = false;
    this.confirmAction = null;

    if (!order || !action) {
      return;
    }

    this.isActing = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const request =
      action === 'cancel'
        ? this.orderService.cancelOrder(order._id)
        : this.orderService.requestRefund(order._id);

    request.subscribe({
      next: () => this.load(order._id),
      error: (error) => {
        this.isActing = false;
        this.errorMessage =
          error?.error?.message ||
          (action === 'cancel'
            ? 'Failed to cancel order'
            : 'Failed to request a refund');
        this.cdr.detectChanges();
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.confirmAction = null;
    this.cdr.detectChanges();
  }

  requestRefund(): void {
    if (!this.order) {
      return;
    }

    this.confirmAction = 'refund';
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  get confirmTitle(): string {
    return this.confirmAction === 'refund' ? 'Request refund' : 'Cancel order';
  }

  get confirmMessage(): string {
    return this.confirmAction === 'refund'
      ? 'Send a refund request for this delivered order?'
      : 'Cancel this order?';
  }

  get confirmButtonText(): string {
    return this.confirmAction === 'refund' ? 'Request refund' : 'Cancel order';
  }
}
