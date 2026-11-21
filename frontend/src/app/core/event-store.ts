import { Injectable, inject, signal } from '@angular/core';
import { errorMessage } from './http-error';
import { EventService } from './event.service';
import { EventItem, SeatUpdate } from './models';
import { SocketService } from './socket.service';

// Single source of truth for the event list.
// Components read `events()`; this store keeps it current from both the REST API (initial load) and the WebSocket (live changes made by other users).
@Injectable({ providedIn: 'root' })
export class EventStore {
  private readonly api = inject(EventService);
  private readonly socket = inject(SocketService);

  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  // The most recent live seat change, so pages can react (e.g. refresh a participant list).
  readonly lastSeatUpdate = signal<SeatUpdate | null>(null);

  constructor() {
    this.socket.created$.subscribe((event) => this.upsert(event));
    this.socket.updated$.subscribe((event) => this.upsert(event));
    this.socket.deleted$.subscribe(({ eventId }) => this.remove(eventId));
    this.socket.seats$.subscribe((update) => this.applySeats(update));
    this.socket.reconnected$.subscribe(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list().subscribe({
      next: (events) => {
        this.events.set(this.sortByDate(events));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.events.set([]);
    this.lastSeatUpdate.set(null);
    this.error.set('');
  }

  upsert(event: EventItem): void {
    this.events.update((list) => this.sortByDate([...list.filter((e) => e.eventId !== event.eventId), event]));
  }

  remove(eventId: string): void {
    this.events.update((list) => list.filter((e) => e.eventId !== eventId));
  }

  applySeats(update: SeatUpdate): void {
    this.events.update((list) =>
      list.map((e) =>
        e.eventId === update.eventId
          ? {
              ...e,
              capacity: update.capacity,
              registeredCount: update.registeredCount,
              seatsAvailable: update.seatsAvailable,
            }
          : e,
      ),
    );
    this.lastSeatUpdate.set(update);
  }

  private sortByDate(events: EventItem[]): EventItem[] {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
