import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { User, Address } from '../models/user.model';

import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface IUserQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  role?: 'customer' | 'admin';
  includeDeleted?: boolean;
  accountStatus?: 'active' | 'blocked' | 'deleted';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly endpoint = `${environment.apiURL}/users`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.endpoint}/me`);
  }

  updateMyProfile(
    data: Partial<Pick<User, 'name' | 'mobilePhone' | 'gender' | 'DOB' | 'nationalId'>>,
  ): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.endpoint}/me`, data);
  }

  getMyAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(`${this.endpoint}/me/addresses`);
  }

  addAddress(data: Address): Observable<ApiResponse<Address[]>> {
    return this.http.post<ApiResponse<Address[]>>(`${this.endpoint}/me/addresses`, data);
  }

  updateAddress(addressId: string, data: Partial<Address>): Observable<ApiResponse<Address[]>> {
    return this.http.patch<ApiResponse<Address[]>>(`${this.endpoint}/me/addresses/${addressId}`, data);
  }

  deleteAddress(addressId: string): Observable<ApiResponse<Address[]>> {
    return this.http.delete<ApiResponse<Address[]>>(`${this.endpoint}/me/addresses/${addressId}`);
  }

  getAllUsers(query: IUserQuery = {}): Observable<PaginatedResponse<User>> {
    const params = this.buildParams(query);

    return this.http.get<PaginatedResponse<User>>(this.endpoint, { params });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.endpoint}/${id}`);
  }

  blockUser(id: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.endpoint}/${id}/block`, {});
  }

  unblockUser(id: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.endpoint}/${id}/unblock`, {});
  }

  createAdmin(data: {
    name: string;
    email: string;
    password: string;
    gender: 'male' | 'female';
    DOB: string;
  }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.endpoint}/admins`, data);
  }

  deleteUser(id: string): Observable<ApiResponse<User>> {
    return this.http.delete<ApiResponse<User>>(`${this.endpoint}/${id}`);
  }

  restoreUser(id: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.endpoint}/${id}/restore`, {});
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
