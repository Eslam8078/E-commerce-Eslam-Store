import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { FAQ } from '../models/faq.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface IFAQQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeDeleted?: boolean;
  isDeleted?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private readonly endpoint = `${environment.apiURL}/faqs`;

  constructor(private http: HttpClient) {}

  getActiveFAQs(query: IFAQQuery = {}): Observable<PaginatedResponse<FAQ>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<FAQ>>(this.endpoint, { params });
  }

  getFAQById(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.get<ApiResponse<FAQ>>(`${this.endpoint}/${id}`);
  }

  getAllFAQs(query: IFAQQuery = {}): Observable<PaginatedResponse<FAQ>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<FAQ>>(`${this.endpoint}/admin`, { params });
  }

  getFAQByIdAdmin(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.get<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}`);
  }

  createFAQ(data: { question: string; answer: string }): Observable<ApiResponse<FAQ>> {
    return this.http.post<ApiResponse<FAQ>>(`${this.endpoint}/admin`, data);
  }

  updateFAQ(
    id: string,
    data: {
      question?: string;
      answer?: string;
    },
  ): Observable<ApiResponse<FAQ>> {
    return this.http.patch<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}`, data);
  }

  activateFAQ(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.patch<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}/activate`, {});
  }

  deactivateFAQ(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.patch<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}/deactivate`, {});
  }

  deleteFAQ(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.delete<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}`);
  }

  restoreFAQ(id: string): Observable<ApiResponse<FAQ>> {
    return this.http.patch<ApiResponse<FAQ>>(`${this.endpoint}/admin/${id}/restore`, {});
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
