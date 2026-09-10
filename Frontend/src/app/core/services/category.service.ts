import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { ICategory } from '../models/category.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface ICategoryQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeInactive?: boolean;
  includeDeleted?: boolean;
  isDeleted?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly endpoint = `${environment.apiURL}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(query: ICategoryQuery = {}): Observable<PaginatedResponse<ICategory>> {
    const params = this.buildParams(query);
    return this.http.get<PaginatedResponse<ICategory>>(this.endpoint, { params });
  }

  getAdminCategories(query: ICategoryQuery = {}): Observable<PaginatedResponse<ICategory>> {
    const params = this.buildParams(query);
    return this.http.get<PaginatedResponse<ICategory>>(`${this.endpoint}/admin`, { params });
  }

  deleteCategory(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.delete<ApiResponse<ICategory>>(`${this.endpoint}/${id}`);
  }

  restoreCategory(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.patch<ApiResponse<ICategory>>(`${this.endpoint}/${id}/restore`, {});
  }

  getAdminCategoryById(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.get<ApiResponse<ICategory>>(`${this.endpoint}/admin/${id}`);
  }

  getCategoryById(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.get<ApiResponse<ICategory>>(`${this.endpoint}/${id}`);
  }

  createCategory(data: { name: string; slug: string }): Observable<ApiResponse<ICategory>> {
    return this.http.post<ApiResponse<ICategory>>(this.endpoint, data);
  }

  updateCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
    },
  ): Observable<ApiResponse<ICategory>> {
    return this.http.patch<ApiResponse<ICategory>>(`${this.endpoint}/${id}`, data);
  }

  activateCategory(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.patch<ApiResponse<ICategory>>(`${this.endpoint}/${id}/activate`, {});
  }

  deactivateCategory(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.patch<ApiResponse<ICategory>>(`${this.endpoint}/${id}/deactivate`, {});
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
