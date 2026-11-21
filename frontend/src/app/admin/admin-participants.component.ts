import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../core/event.service';
import { EventStore } from '../core/event-store';
import { errorMessage } from '../core/http-error';
import { EventItem, Participant } from '../core/models';
import { RegistrationService } from '../core/registration.service';

@Component({
  selector: 'app-admin-participants',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-participants.component.html',
})
export class AdminParticipantsComponent {
  private readonly registrations = inject(RegistrationService);
  private readonly events = inject(EventService);
  private readonly store = inject(EventStore);

  protected readonly eventId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly event = signal<EventItem | null>(null);
  protected readonly participants = signal<Participant[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.load();

    // Live: when anyone registers or cancels for THIS event, refresh the list automatically.
    effect(() => {
      const update = this.store.lastSeatUpdate();
      if (update && update.eventId === this.eventId) {
        untracked(() => this.load());
      }
    });
  }

  private load(): void {
    this.events.get(this.eventId).subscribe({
      next: (event) => this.event.set(event),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
    this.registrations.participants(this.eventId).subscribe({
      next: (list) => {
        this.participants.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
