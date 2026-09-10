import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';

import { OrderService, IOrderQuery } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'rejected',
  'refund',
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  orders: Order[] = [];

  statusOptions = STATUS_FLOW;

  status = '';

  page = 1;

  limit = 10;

  total = 0;

  totalPages = 0;

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  expandedId: string | null = null;

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(() => this.load());
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: IOrderQuery = {
      page: this.page,
      limit: this.limit,
      sort: 'orderedAt',
      order: 'desc',
    };

    if (this.status) {
      query.status = this.status as OrderStatus;
    }

    this.orderService.getAllOrders(query).subscribe({
      next: (response) => {
        this.orders = response.data || [];
        this.total = response.pagination?.total ?? response.total ?? 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;

        const orderId = this.route.snapshot.queryParamMap.get('orderId');
        if (orderId) {
          const listedOrder = this.orders.find((order) => order._id === orderId);

          if (listedOrder) {
            this.expandedId = orderId;
          } else {
            this.orderService.getOrderById(orderId).subscribe({
              next: (orderResponse) => {
                this.orders = [orderResponse.data, ...this.orders];
                this.expandedId = orderId;
                this.total += 1;
                this.cdr.detectChanges();
              },
            });
          }
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load orders';
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.load();
  }

  toggleExpand(order: Order): void {
    this.expandedId = this.expandedId === order._id ? null : order._id;
  }

  customerName(order: Order): string {
    return typeof order.userId === 'object' ? order.userId.name : 'Customer';
  }

  productName(item: Order['items'][number]): string {
    return typeof item.productId === 'object' ? item.productId.name : 'Product';
  }

  nextStatusOptions(order: Order): OrderStatus[] {
    return this.statusOptions.filter((status) => status !== order.orderStatus);
  }

  handleRefund(order: Order, approve: boolean): void {
    this.actionLoadingId = order._id;
    const action = approve ? this.orderService.approveRefund(order._id) : this.orderService.rejectRefund(order._id);
    action.subscribe({
      next: () => { this.actionLoadingId = null; this.load(); },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update refund';
        this.cdr.detectChanges();
      },
    });
  }

  updateStatus(order: Order, newStatus: string): void {
    if (!newStatus || newStatus === order.orderStatus) {
      return;
    }

    this.actionLoadingId = order._id;

    this.orderService.updateOrderStatus(order._id, newStatus as OrderStatus).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.cdr.detectChanges();
        this.load();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update order status';
        this.cdr.detectChanges();
      },
    });
  }
}
