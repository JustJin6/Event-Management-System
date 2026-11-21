import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MyRegistration, Participant, RegistrationResult } from './models';

// HTTP calls for registrations.
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  register(eventId: string): Observable<RegistrationResult> {
    return this.http.post<RegistrationResult>(`/api/events/${eventId}/register`, {});
  }

  cancel(eventId: string): Observable<RegistrationResult> {
    return this.http.delete<RegistrationResult>(`/api/events/${eventId}/register`);
  }

  mine(): Observable<MyRegistration[]> {
    return this.http.get<MyRegistration[]>('/api/registrations/mine');
  }

  participants(eventId: string): Observable<Participant[]> {
    return this.http.get<Participant[]>(`/api/events/${eventId}/participants`);
  }
}
