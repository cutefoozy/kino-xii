import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_PATHS, AuthService } from './auth-service';
import { ModalService } from './modal-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const modal = inject(ModalService);

  const token = auth.token;
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthCall = Object.values(AUTH_PATHS).some((p) => req.url.endsWith(p));
      if (err.status === 401 && !isAuthCall) {
        auth.clearSession();
        modal.open('login');
      }
      return throwError(() => err);
    }),
  );
};