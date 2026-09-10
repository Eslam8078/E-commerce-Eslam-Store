import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { IProduct } from '../models/product.model';

import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface IProductQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  season?: string;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean;
  includeDeleted?: boolean;
  isDeleted?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly endpoint = `${environment.apiURL}/products`;

  constructor(private http: HttpClient) {}

  getProducts(query: IProductQuery = {}): Observable<PaginatedResponse<IProduct>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<IProduct>>(this.endpoint, { params });
  }

  getAdminProductById(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.get<ApiResponse<IProduct>>(`${this.endpoint}/admin/${id}`);
  }

  getProductById(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.get<ApiResponse<IProduct>>(`${this.endpoint}/${id}`);
  }

  getProductBySlug(slug: string): Observable<ApiResponse<IProduct>> {
    return this.http.get<ApiResponse<IProduct>>(`${this.endpoint}/slug/${slug}`);
  }

  createProduct(data: FormData): Observable<ApiResponse<IProduct>> {
    return this.http.post<ApiResponse<IProduct>>(this.endpoint, data);
  }

  updateProduct(id: string, data: FormData): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}`, data);
  }

  getAdminProducts(query: IProductQuery = {}): Observable<PaginatedResponse<IProduct>> {
    const params = this.buildParams(query);
    return this.http.get<PaginatedResponse<IProduct>>(`${this.endpoint}/admin`, { params });
  }

  deleteProduct(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.delete<ApiResponse<IProduct>>(`${this.endpoint}/${id}`);
  }

  toggleBestSeller(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}/best-seller`, {});
  }

  toggleNewArrival(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}/new-arrival`, {});
  }

  restoreProduct(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}/restore`, {});
  }

  activateProduct(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}/activate`, {});
  }

  deactivateProduct(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(`${this.endpoint}/${id}/deactivate`, {});
  }

  deactivateSeasonProducts(season: string): Observable<ApiResponse<{ season: string; modifiedCount: number }>> {
    return this.http.patch<ApiResponse<{ season: string; modifiedCount: number }>>(`${this.endpoint}/admin/season/${season}/deactivate`, {});
  }

  activateSeasonProducts(season: string): Observable<ApiResponse<{ season: string; modifiedCount: number }>> {
    return this.http.patch<ApiResponse<{ season: string; modifiedCount: number }>>(`${this.endpoint}/admin/season/${season}/activate`, {});
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
