import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  get<T>(path: string, options?: { params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]> }) {
    return this.http.get<T>(`${API_URL}${path}`, options);
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${API_URL}${path}`, body);
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(`${API_URL}${path}`, body);
  }
}