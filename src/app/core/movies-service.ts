import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Api } from './api';
import { ApiResponse, Movie, NotifyResult, VenueSessions } from './models';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private api = inject(Api);

  bySlug(slug: string) {
    return this.api.get<ApiResponse<Movie>>(`/movies/${slug}`);
  }

  sessions(slug: string, date?: string) {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.api.get<ApiResponse<VenueSessions[]>>(`/movies/${slug}/sessions`, { params });
  }

  notify(slug: string) {
    return this.api.post<ApiResponse<NotifyResult>>(`/movies/${slug}/notify`, {});
  }
}