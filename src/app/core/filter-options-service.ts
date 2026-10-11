import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Api } from './api';
import { ApiResponse, FilterOptions } from './models';

@Injectable({ providedIn: 'root' })
export class FilterOptionsService {
  private api = inject(Api);

  readonly options = signal<FilterOptions | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  load() {
    if (this.options() || this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    this.api
      .get<ApiResponse<FilterOptions>>('/filter-options')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.options.set(res.data),
        error: () => this.error.set(true),
      });
  }
}