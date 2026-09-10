import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import {
  IRevenueReport,
  ITopProduct,
  ITopSaleProduct,
  IOrdersByStatus,
  ISalesByDate,
  ISalesByGovernorate,
} from '../models/report.model';

import { IProduct } from '../models/product.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly endpoint = `${environment.apiURL}/reports`;

  constructor(private http: HttpClient) {}

  getRevenueReport(fromDate: string, toDate: string): Observable<ApiResponse<IRevenueReport>> {
    const params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);

    return this.http.get<ApiResponse<IRevenueReport>>(`${this.endpoint}/revenue`, { params });
  }

  getTopProducts(
    query: {
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Observable<ApiResponse<ITopProduct[]>> {
    const params = this.buildParams(query);

    return this.http.get<ApiResponse<ITopProduct[]>>(`${this.endpoint}/top-products`, { params });
  }

  getTopSales(limit = 10): Observable<ApiResponse<ITopSaleProduct[]>> {
    const params = new HttpParams().set('limit', limit);

    return this.http.get<ApiResponse<ITopSaleProduct[]>>(`${this.endpoint}/top-sales`, { params });
  }

  getBestSellers(limit = 8): Observable<ApiResponse<IProduct[]>> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiResponse<IProduct[]>>(`${this.endpoint}/best-sellers`, { params });
  }

  getNewArrivals(limit = 10): Observable<ApiResponse<IProduct[]>> {
    const params = new HttpParams().set('limit', limit);

    return this.http.get<ApiResponse<IProduct[]>>(`${this.endpoint}/new-arrivals`, { params });
  }

  getOrdersByStatus(
    query: {
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Observable<ApiResponse<IOrdersByStatus[]>> {
    const params = this.buildParams(query);

    return this.http.get<ApiResponse<IOrdersByStatus[]>>(`${this.endpoint}/orders-by-status`, {
      params,
    });
  }

  getSalesByDate(
    query: {
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Observable<ApiResponse<ISalesByDate[]>> {
    const params = this.buildParams(query);

    return this.http.get<ApiResponse<ISalesByDate[]>>(`${this.endpoint}/sales-by-date`, { params });
  }

  getSalesByGovernorate(
    query: {
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Observable<ApiResponse<ISalesByGovernorate[]>> {
    const params = this.buildParams(query);

    return this.http.get<ApiResponse<ISalesByGovernorate[]>>(
      `${this.endpoint}/sales-by-governorate`,
      { params },
    );
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
