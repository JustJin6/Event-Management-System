import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/http-error';
import { MyRegistration } from '../core/models';
import { RegistrationService } from '../core/registration.service';

@Component({
  selector: 'app-my-registrations',
  imports: [DatePipe, RouterLink],
  templateUrl: './my-registrations.component.html',
})
export class MyRegistrationsComponent {
  private readonly registrations = inject(RegistrationService);

  protected readonly items = signal<MyRegistration[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.registrations.mine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected cancel(item: MyRegistration): void {
    if (!window.confirm(`Cancel your registration for "${item.event.title}"?`)) return;
    this.error.set('');
    this.registrations.cancel(item.eventId).subscribe({
      next: () => this.items.update((list) => list.filter((r) => r.registrationId !== item.registrationId)),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }
}
