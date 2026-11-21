import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EventInput, EventItem } from './models';

// HTTP calls for events.
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  list(): Observable<EventItem[]> {
    return this.http.get<EventItem[]>('/api/events');
  }

  get(eventId: string): Observable<EventItem> {
    return this.http.get<EventItem>(`/api/events/${eventId}`);
  }

  create(input: EventInput): Observable<EventItem> {
    return this.http.post<EventItem>('/api/events', input);
  }

  update(eventId: string, input: EventInput): Observable<EventItem> {
    return this.http.put<EventItem>(`/api/events/${eventId}`, input);
  }

  updateCapacity(eventId: string, capacity: number): Observable<EventItem> {
    return this.http.patch<EventItem>(`/api/events/${eventId}/capacity`, { capacity });
  }

  remove(eventId: string): Observable<{ eventId: string }> {
    return this.http.delete<{ eventId: string }>(`/api/events/${eventId}`);
  }
}
