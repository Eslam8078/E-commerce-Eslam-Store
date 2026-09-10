import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { Order, OrderStatus } from '../models/order.model';

import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface IOrderQuote {
  subtotal: number;
  deliveryFee: number;
  totalPrice: number;
}

export interface DeliveryCity {
  name: string;
  fee: number;
}

export interface DeliveryLocation {
  governorate: string;
  cities: DeliveryCity[];
}

export interface IOrderQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly endpoint = `${environment.apiURL}/orders`;

  constructor(private http: HttpClient) {}

  getDeliveryLocations(): Observable<ApiResponse<DeliveryLocation[]>> {
    return this.http.get<ApiResponse<DeliveryLocation[]>>(`${this.endpoint}/delivery-locations`);
  }

  addGovernorate(governorate: string): Observable<ApiResponse<DeliveryLocation>> {
    return this.http.post<ApiResponse<DeliveryLocation>>(
      `${environment.apiURL}/delivery-locations/governorates`,
      { governorate },
    );
  }

  addDeliveryCity(governorate: string, name: string, fee: number): Observable<ApiResponse<DeliveryLocation>> {
    return this.http.post<ApiResponse<DeliveryLocation>>(
      `${environment.apiURL}/delivery-locations/${encodeURIComponent(governorate)}/cities`,
      { name, fee },
    );
  }

  updateDeliveryLocation(
    currentGovernorate: string,
    governorate: string,
    cities: DeliveryCity[],
  ): Observable<ApiResponse<DeliveryLocation>> {
    return this.http.patch<ApiResponse<DeliveryLocation>>(
      `${environment.apiURL}/delivery-locations/${encodeURIComponent(currentGovernorate)}`,
      { governorate, cities },
    );
  }

  deleteGovernorate(governorate: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiURL}/delivery-locations/governorates/${encodeURIComponent(governorate)}`,
    );
  }

  deleteDeliveryCity(governorate: string, city: string): Observable<ApiResponse<DeliveryLocation>> {
    return this.http.delete<ApiResponse<DeliveryLocation>>(
      `${environment.apiURL}/delivery-locations/${encodeURIComponent(governorate)}/cities/${encodeURIComponent(city)}`,
    );
  }

  getOrderQuote(addressId: string): Observable<ApiResponse<IOrderQuote>> {
    return this.http.get<ApiResponse<IOrderQuote>>(`${this.endpoint}/quote`, { params: { addressId } });
  }

  createOrder(addressId: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.endpoint, { addressId });
  }

  getMyOrders(
    query: Omit<IOrderQuery, 'status' | 'fromDate' | 'toDate'> = {},
  ): Observable<PaginatedResponse<Order>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<Order>>(`${this.endpoint}/my-orders`, { params });
  }

  getMyOrderById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.endpoint}/my-orders/${id}`);
  }

  cancelOrder(id: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.endpoint}/${id}/cancel`, {});
  }

  requestRefund(id: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.endpoint}/${id}/refund`, {});
  }

  getAllOrders(query: IOrderQuery = {}): Observable<PaginatedResponse<Order>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<Order>>(this.endpoint, { params });
  }

  getOrderById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.endpoint}/${id}`);
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.endpoint}/${id}/status`, { status });
  }

  approveRefund(id: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.endpoint}/${id}/refund/approve`, {});
  }

  rejectRefund(id: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.endpoint}/${id}/refund/reject`, {});
  }

  private buildParams<T extends object>(query: T): HttpParams {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
