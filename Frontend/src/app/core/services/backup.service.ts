import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/env';

export interface BackupFile {
  fileName: string;
  sizeInBytes: number;
  createdAt: string;
}

export interface BackupsResponse {
  message: string;
  count: number;
  data: BackupFile[];
}

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly endpoint = `${environment.apiURL}/backups`;

  constructor(private http: HttpClient) {}

  listBackups(): Observable<BackupsResponse> {
    return this.http.get<BackupsResponse>(this.endpoint);
  }

  createBackup(): Observable<{ message: string; data: BackupFile }> {
    return this.http.post<{ message: string; data: BackupFile }>(this.endpoint, {});
  }

  restoreBackup(fileName: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.endpoint}/restore`, { fileName });
  }
}
