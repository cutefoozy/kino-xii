import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { Api } from './api';
import { AuthService } from './auth-service';
import { ApiResponse, User } from './models';

export interface ProfileUpdate {
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  preferredVenueId: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(Api);
  private auth = inject(AuthService);

  update(body: ProfileUpdate) {
    const form = new FormData();
    form.append('fullName', body.fullName);
    form.append('mobileNumber', body.mobileNumber);
    form.append('dateOfBirth', body.dateOfBirth);
    form.append('preferredVenueId', body.preferredVenueId === null ? '' : String(body.preferredVenueId));

    return this.api
      .put<ApiResponse<User>>('/profile', form)
      .pipe(tap((res) => this.auth.setUser(res.data)));
  }
}