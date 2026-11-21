import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { EventItem, SeatUpdate } from './models';

// The WebSocket connection (Socket.IO). It only receives messages from the server and republishes them as RxJS streams; EventStore listens to those streams.
@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private hasConnectedBefore = false;

  readonly connected = signal(false);
  readonly online = signal(0);

  readonly created$ = new Subject<EventItem>();
  readonly updated$ = new Subject<EventItem>();
  readonly deleted$ = new Subject<{ eventId: string }>();
  readonly seats$ = new Subject<SeatUpdate>();
  // Fires when the connection comes back after a drop, so data can be reloaded.
  readonly reconnected$ = new Subject<void>();

  connect(token: string): void {
    this.disconnect();
    // Same origin as the page: the dev proxy / nginx forwards /socket.io to the back end.
    const socket = io({ auth: { token }, transports: ['websocket'] });
    this.socket = socket;

    socket.on('connect', () => {
      this.connected.set(true);
      if (this.hasConnectedBefore) this.reconnected$.next();
      this.hasConnectedBefore = true;
    });
    socket.on('disconnect', () => this.connected.set(false));
    socket.on('presence', (data: { online: number }) => this.online.set(data.online));
    socket.on('event:created', (event: EventItem) => this.created$.next(event));
    socket.on('event:updated', (event: EventItem) => this.updated$.next(event));
    socket.on('event:deleted', (data: { eventId: string }) => this.deleted$.next(data));
    socket.on('event:seats', (update: SeatUpdate) => this.seats$.next(update));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.hasConnectedBefore = false;
    this.connected.set(false);
    this.online.set(0);
  }
}
