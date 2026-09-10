import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { Testimonial } from '../models/testimonial.model';

import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface ITestimonialQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: 'pending' | 'approved' | 'declined';
  includeDeleted?: boolean;
  isDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly endpoint = `${environment.apiURL}/testimonials`;

  constructor(private http: HttpClient) {}

  getApprovedTestimonials(
    query: Omit<ITestimonialQuery, 'status'> = {},
  ): Observable<PaginatedResponse<Testimonial>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<Testimonial>>(`${this.endpoint}/approved`, { params });
  }

  createTestimonial(data: {
    message: string;
    rating: number;
  }): Observable<ApiResponse<Testimonial>> {
    return this.http.post<ApiResponse<Testimonial>>(this.endpoint, data);
  }

  getMyTestimonials(
    query: Omit<ITestimonialQuery, 'status'> = {},
  ): Observable<PaginatedResponse<Testimonial>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<Testimonial>>(`${this.endpoint}/my-testimonials`, {
      params,
    });
  }

  deleteMyTestimonial(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.delete<ApiResponse<Testimonial>>(`${this.endpoint}/my-testimonials/${id}`);
  }

  getAllTestimonials(query: ITestimonialQuery = {}): Observable<PaginatedResponse<Testimonial>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<Testimonial>>(this.endpoint, { params });
  }

  getTestimonialById(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.get<ApiResponse<Testimonial>>(`${this.endpoint}/${id}`);
  }

  deleteTestimonial(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.delete<ApiResponse<Testimonial>>(`${this.endpoint}/${id}`);
  }

  restoreTestimonial(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.patch<ApiResponse<Testimonial>>(`${this.endpoint}/${id}/restore`, {});
  }

  updateTestimonialStatus(
    id: string,
    status: 'approved' | 'declined',
  ): Observable<ApiResponse<Testimonial>> {
    return this.http.patch<ApiResponse<Testimonial>>(`${this.endpoint}/${id}/status`, { status });
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
