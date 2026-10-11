import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { Api } from './api';
import { ApiResponse, AuthData, User } from './models';
import { HttpErrorResponse } from '@angular/common/http';

export const AUTH_PATHS = {
  register: '/register',
  login: '/login',
  logout: '/logout',
  me: '/me',
};

const TOKEN_KEY = 'kino_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(Api);

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly restoring = signal(false);
  readonly restoreError = signal(false);

  get token() { 
    return localStorage.getItem(TOKEN_KEY);
  }

  register(body: FormData) {
    return this.api
      .post<ApiResponse<AuthData>>(AUTH_PATHS.register, body)
      .pipe(tap((res) => this.setSession(res.data)));
  }

  login(body: { email: string; password: string }) {
    return this.api
      .post<ApiResponse<AuthData>>(AUTH_PATHS.login, body)
      .pipe(tap((res) => this.setSession(res.data)));
  }

  logout() {
    return this.api.post(AUTH_PATHS.logout, {}).pipe(finalize(() => this.clearSession()));
  }

  restore() {
    if (!this.token) return;
    this.restoring.set(true);
    this.restoreError.set(false);
    this.api
      .get<ApiResponse<User>>(AUTH_PATHS.me)
      .pipe(finalize(() => this.restoring.set(false)))
      .subscribe({
        next: (res) => this.user.set(res.data),
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) this.clearSession();
          else this.restoreError.set(true);
        },
      });
  }

setUser(user: User) {
  this.user.set(user);
}

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
  }

  private setSession(data: AuthData) {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.user.set(data.user);
  }
}