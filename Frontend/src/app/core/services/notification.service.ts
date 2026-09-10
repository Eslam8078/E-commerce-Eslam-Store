import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

import { Notification } from '../models/notification.model';
import { PaginatedResponse, ApiResponse } from '../models/api-response.model';

export interface INotificationsResponse extends PaginatedResponse<Notification> {
  unreadCount: number;
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  unread?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly endpoint = `${environment.apiURL}/notifications`;

  constructor(private http: HttpClient) {}

  getMyNotifications(query: INotificationQuery = {}): Observable<INotificationsResponse> {
    const params = this.buildParams(query);

    return this.http.get<INotificationsResponse>(this.endpoint, { params });
  }

  getNotificationById(id: string): Observable<ApiResponse<Notification>> {
    return this.http.get<ApiResponse<Notification>>(`${this.endpoint}/${id}`);
  }

  markAsRead(id: string): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(`${this.endpoint}/${id}/read`, {});
  }

  deleteNotification(id: string): Observable<{
    message: string;
    data: { _id: string };
  }> {
    return this.http.delete<{
      message: string;
      data: { _id: string };
    }>(`${this.endpoint}/${id}`);
  }

  markAllAsRead(): Observable<{
    message: string;
    modifiedCount: number;
  }> {
    return this.http.patch<{
      message: string;
      modifiedCount: number;
    }>(`${this.endpoint}/read-all`, {});
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
