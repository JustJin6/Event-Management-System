import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventStore } from '../core/event-store';
import { errorMessage } from '../core/http-error';
import { RegistrationService } from '../core/registration.service';

@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './event-detail.component.html',
})
export class EventDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registrations = inject(RegistrationService);
  protected readonly store = inject(EventStore);

  private readonly eventId = this.route.snapshot.paramMap.get('id') ?? '';

  // Always the latest copy of this event, including live changes from other users.
  protected readonly event = computed(() => this.store.events().find((e) => e.eventId === this.eventId));
  protected readonly isRegistered = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    if (this.store.events().length === 0 && !this.store.loading()) {
      this.store.load();
    }
    this.registrations.mine().subscribe({
      next: (list) => this.isRegistered.set(list.some((r) => r.eventId === this.eventId)),
    });
  }

  protected register(): void {
    this.run(this.registrations.register(this.eventId), true, 'You are registered for this event.');
  }

  protected cancel(): void {
    if (!window.confirm('Cancel your registration for this event?')) return;
    this.run(this.registrations.cancel(this.eventId), false, 'Your registration was cancelled.');
  }

  private run(
    request: ReturnType<RegistrationService['register']>,
    registeredAfter: boolean,
    successMessage: string,
  ): void {
    this.busy.set(true);
    this.message.set('');
    this.error.set('');
    request.subscribe({
      next: (result) => {
        this.store.applySeats(result.seats);
        this.isRegistered.set(registeredAfter);
        this.message.set(successMessage);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
