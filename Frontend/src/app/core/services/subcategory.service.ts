import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { ISubCategory } from '../models/subcategory.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface ISubCategoryQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  categoryId?: string;
  includeInactive?: boolean;
  includeDeleted?: boolean;
  isDeleted?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SubCategoryService {
  private readonly endpoint = `${environment.apiURL}/subcategories`;

  constructor(private http: HttpClient) {}

  getSubCategories(query: ISubCategoryQuery = {}): Observable<PaginatedResponse<ISubCategory>> {
    const params = this.buildParams(query);
    return this.http.get<PaginatedResponse<ISubCategory>>(this.endpoint, { params });
  }

  getAdminSubCategories(query: ISubCategoryQuery = {}): Observable<PaginatedResponse<ISubCategory>> {
    const params = this.buildParams(query);
    return this.http.get<PaginatedResponse<ISubCategory>>(`${this.endpoint}/admin`, { params });
  }

  getAdminSubCategoryById(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.get<ApiResponse<ISubCategory>>(`${this.endpoint}/admin/${id}`);
  }

  getSubCategoryById(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.get<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}`);
  }

  createSubCategory(data: {
    name: string;
    slug: string;
    categoryId: string;
  }): Observable<ApiResponse<ISubCategory>> {
    return this.http.post<ApiResponse<ISubCategory>>(this.endpoint, data);
  }

  updateSubCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      categoryId?: string;
    },
  ): Observable<ApiResponse<ISubCategory>> {
    return this.http.patch<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}`, data);
  }

  deleteSubCategory(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.delete<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}`);
  }

  restoreSubCategory(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.patch<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}/restore`, {});
  }

  activateSubCategory(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.patch<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}/activate`, {});
  }

  deactivateSubCategory(id: string): Observable<ApiResponse<ISubCategory>> {
    return this.http.patch<ApiResponse<ISubCategory>>(`${this.endpoint}/${id}/deactivate`, {});
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
