import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventStore } from './event-store';
import { EventItem } from './models';
import { SocketService } from './socket.service';

const event = (id: string, date: string, overrides: Partial<EventItem> = {}): EventItem => ({
  eventId: id,
  title: `Event ${id}`,
  description: 'Description',
  date,
  venue: 'Hall',
  capacity: 10,
  registeredCount: 0,
  seatsAvailable: 10,
  ...overrides,
});

function setup(): { store: EventStore; socket: SocketService; http: HttpTestingController } {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return {
    store: TestBed.inject(EventStore),
    socket: TestBed.inject(SocketService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('EventStore', () => {
  it('loads events from the API sorted by date', () => {
    const { store, http } = setup();
    store.load();
    http.expectOne('/api/events').flush([event('b', '2026-12-01T10:00:00Z'), event('a', '2026-11-01T10:00:00Z')]);
    expect(store.events().map((e) => e.eventId)).toEqual(['a', 'b']);
    expect(store.loading()).toBe(false);
  });

  it('shows an error message when loading fails', () => {
    const { store, http } = setup();
    store.load();
    http.expectOne('/api/events').flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
    expect(store.error()).toBe('Boom');
  });

  it('adds, updates and removes events when the server pushes changes', () => {
    const { store, socket } = setup();

    socket.created$.next(event('a', '2026-11-01T10:00:00Z'));
    expect(store.events()).toHaveLength(1);

    socket.updated$.next(event('a', '2026-11-01T10:00:00Z', { title: 'Renamed' }));
    expect(store.events()[0].title).toBe('Renamed');

    socket.deleted$.next({ eventId: 'a' });
    expect(store.events()).toHaveLength(0);
  });

  it('updates seat counts live', () => {
    const { store, socket } = setup();
    socket.created$.next(event('a', '2026-11-01T10:00:00Z'));

    socket.seats$.next({ eventId: 'a', capacity: 10, registeredCount: 4, seatsAvailable: 6 });

    expect(store.events()[0]).toMatchObject({ registeredCount: 4, seatsAvailable: 6 });
    expect(store.lastSeatUpdate()?.eventId).toBe('a');
  });
});
