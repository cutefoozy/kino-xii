import { HttpErrorResponse } from '@angular/common/http';

export function toErrorMessage(err: HttpErrorResponse, what: string): string {
  if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';
  if (err.status === 422 && err.error?.message) return err.error.message;
  return `Something went wrong while loading ${what}.`;
}