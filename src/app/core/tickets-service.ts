import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { ApiResponse, Order } from './models';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private api = inject(Api);

  list() {
    return this.api.get<ApiResponse<Order[]>>('/tickets');
  }

  refund(reference: string) {
    return this.api.post<ApiResponse<Order>>(`/orders/${reference}/refund`, {});
  }
}