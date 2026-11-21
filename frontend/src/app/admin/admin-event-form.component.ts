import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fromInputValue, toInputValue } from '../core/datetime';
import { EventService } from '../core/event.service';
import { EventStore } from '../core/event-store';
import { errorMessage } from '../core/http-error';
import { EventInput } from '../core/models';

// One form used for both "Create event" and "Edit event".
@Component({
  selector: 'app-admin-event-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-event-form.component.html',
})
export class AdminEventFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventService);
  private readonly store = inject(EventStore);
  private readonly router = inject(Router);

  // Set when editing; null when creating.
  protected readonly eventId = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    date: ['', [Validators.required]],
    venue: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    capacity: [30, [Validators.required, Validators.min(1), Validators.max(100000)]],
  });
  protected readonly busy = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    if (this.eventId) {
      this.loading.set(true);
      this.api.get(this.eventId).subscribe({
        next: (event) => {
          this.form.patchValue({
            title: event.title,
            description: event.description,
            date: toInputValue(event.date),
            venue: event.venue,
            capacity: event.capacity,
          });
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const input: EventInput = { ...value, date: fromInputValue(value.date) };

    this.busy.set(true);
    this.error.set('');
    const request = this.eventId ? this.api.update(this.eventId, input) : this.api.create(input);
    request.subscribe({
      next: (saved) => {
        this.store.upsert(saved);
        void this.router.navigate(['/admin/events']);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
