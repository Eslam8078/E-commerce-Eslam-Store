import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { IAuthData, ILoginRequest, IRegisterRequest } from '../models/auth.model';

import { environment } from '../../../environment/env';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly userKey = 'current_user';

  private readonly apiURL = `${environment.apiURL}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: ILoginRequest): Observable<ApiResponse<IAuthData>> {
    return this.http.post<ApiResponse<IAuthData>>(`${this.apiURL}/login`, credentials).pipe(
      tap((response) => {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }),
    );
  }

  register(data: IRegisterRequest): Observable<ApiResponse<IAuthData>> {
    return this.http.post<ApiResponse<IAuthData>>(`${this.apiURL}/register`, data).pipe(
      tap((response) => {
        if (response.data?.token) {
          this.setToken(response.data.token);
        }

        if (response.data?.user) {
          this.setUser(response.data.user);
        }
      }),
    );
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiURL}/users/me`);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const rawUser = localStorage.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      this.logout();
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  isCustomer(): boolean {
    return this.getUser()?.role === 'customer';
  }
}
