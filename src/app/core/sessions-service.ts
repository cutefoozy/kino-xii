import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Api } from './api';
import { SessionsResponse } from './models';

export interface SessionsFilterParams {
  date?: string;
  venues?: string[];
  formats?: string[];
  languages?: string[];
  bands?: string[];
  search?: string;
  sort?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private api = inject(Api);

  list(filters: SessionsFilterParams) {
    let params = new HttpParams();

    if (filters.date) params = params.set('date', filters.date);
    if (filters.venues?.length) {
      filters.venues.forEach((v) => { params = params.append('venues[]', v); });
    }
    if (filters.formats?.length) {
      filters.formats.forEach((f) => { params = params.append('formats[]', f); });
    }
    if (filters.languages?.length) {
      filters.languages.forEach((l) => { params = params.append('languages[]', l); });
    }
    if (filters.bands?.length) {
      filters.bands.forEach((b) => { params = params.append('bands[]', b); });
    }
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page && filters.page > 1) params = params.set('page', filters.page.toString());

    return this.api.get<SessionsResponse>('/sessions', { params });
  }
}