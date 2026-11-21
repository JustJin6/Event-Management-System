import { HttpErrorResponse } from '@angular/common/http';

// Turns an API error into a message that is safe and useful to show to the user.
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    const details: unknown = err.error?.errors;
    if (Array.isArray(details) && details.length > 0) {
      return details.join('. ');
    }
    if (typeof err.error?.message === 'string') {
      return err.error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}
