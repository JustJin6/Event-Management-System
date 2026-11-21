import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../core/event.service';
import { EventStore } from '../core/event-store';
import { errorMessage } from '../core/http-error';
import { EventItem } from '../core/models';

@Component({
  selector: 'app-admin-event-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-event-list.component.html',
})
export class AdminEventListComponent {
  protected readonly store = inject(EventStore);
  private readonly api = inject(EventService);

  protected readonly notice = signal('');
  protected readonly error = signal('');

  protected setCapacity(event: EventItem, rawValue: string): void {
    this.notice.set('');
    this.error.set('');
    const capacity = Number(rawValue);
    this.api.updateCapacity(event.eventId, capacity).subscribe({
      next: (updated) => {
        this.store.upsert(updated);
        this.notice.set(`Capacity of "${updated.title}" is now ${updated.capacity}.`);
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected delete(event: EventItem): void {
    const warning = event.registeredCount > 0
      ? `Delete "${event.title}"? Its ${event.registeredCount} registration(s) will be removed too.`
      : `Delete "${event.title}"?`;
    if (!window.confirm(warning)) return;

    this.notice.set('');
    this.error.set('');
    this.api.remove(event.eventId).subscribe({
      next: () => {
        this.store.remove(event.eventId);
        this.notice.set(`"${event.title}" was deleted.`);
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }
}
