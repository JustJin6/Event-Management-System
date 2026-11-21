import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isUpcoming } from '../core/datetime';
import { EventStore } from '../core/event-store';
import { RegistrationService } from '../core/registration.service';

@Component({
  selector: 'app-event-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './event-list.component.html',
})
export class EventListComponent {
  protected readonly store = inject(EventStore);
  private readonly registrations = inject(RegistrationService);

  private readonly myEventIds = signal<ReadonlySet<string>>(new Set());

  // Upcoming events only, soonest first. Updates live as the store changes.
  protected readonly upcoming = computed(() => this.store.events().filter((e) => isUpcoming(e.date)));

  constructor() {
    this.registrations.mine().subscribe({
      next: (list) => this.myEventIds.set(new Set(list.map((r) => r.eventId))),
      // The badge is a nice-to-have; the list still works without it.
      error: () => this.myEventIds.set(new Set()),
    });
  }

  protected isRegistered(eventId: string): boolean {
    return this.myEventIds().has(eventId);
  }
}
