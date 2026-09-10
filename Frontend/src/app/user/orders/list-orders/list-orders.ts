import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-list-orders',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, ConfirmDialog],
  templateUrl: './list-orders.html',
  styleUrl: './list-orders.css',
})
export class ListOrders implements OnInit {
  orders: Order[] = [];

  page = 1;

  totalPages = 0;

  isLoading = true;

  errorMessage = '';

  actionLoadingId: string | null = null;

  confirmOpen = false;
  pendingCancelOrder: Order | null = null;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.orderService
      .getMyOrders({
        page: this.page,
        limit: 10,
        sort: 'orderedAt',
        order: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.orders = response.data || [];
          this.totalPages = response.pagination?.totalPages || response.pages || 1;
          this.isLoading = false;

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load orders';

          this.isLoading = false;

          this.cdr.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.page = page;
    this.load();
  }

  canCancel(order: Order): boolean {
    return ['pending', 'preparing'].includes(order.orderStatus);
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.pendingCancelOrder = order;
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmCancelOrder(): void {
    const order = this.pendingCancelOrder;

    this.confirmOpen = false;
    this.pendingCancelOrder = null;

    if (!order) {
      return;
    }

    this.actionLoadingId = order._id;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.orderService.cancelOrder(order._id).subscribe({
      next: () => {
        this.actionLoadingId = null;

        this.cdr.detectChanges();

        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;

        this.errorMessage = error?.error?.message || 'Failed to cancel order';

        this.cdr.detectChanges();
      },
    });
  }
  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingCancelOrder = null;
    this.cdr.detectChanges();
  }
}
