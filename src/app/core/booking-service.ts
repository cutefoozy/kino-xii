import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { ApiResponse, SeatMap, SeatHold, Order, Session } from './models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private api = inject(Api);

  getSeats(sessionId: number) {
    return this.api.get<ApiResponse<SeatMap>>(`/sessions/${sessionId}/seats`);
  }

  holdSeats(sessionId: number, seats: { seatId: number; ticketType: string }[]) {
    return this.api.post<ApiResponse<SeatHold>>(`/sessions/${sessionId}/holds`, { seats });
  }

  releaseHold(holdId: string) {
    return this.api.delete(`/holds/${holdId}`);
  }
  
  getSession(sessionId: number) {
    return this.api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
  }

  completeOrder(body: {
    holdId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
  }) {
    return this.api.post<ApiResponse<Order>>('/orders', body);
  }
}