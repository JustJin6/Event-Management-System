import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { EventListComponent } from './participant/event-list.component';
import { EventDetailComponent } from './participant/event-detail.component';
import { MyRegistrationsComponent } from './participant/my-registrations.component';
import { AdminEventListComponent } from './admin/admin-event-list.component';
import { AdminEventFormComponent } from './admin/admin-event-form.component';
import { AdminParticipantsComponent } from './admin/admin-participants.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  // Participant pages
  {
    path: 'events',
    canActivate: [authGuard, roleGuard('participant')],
    children: [
      { path: '', component: EventListComponent },
      { path: ':id', component: EventDetailComponent },
    ],
  },
  {
    path: 'my-registrations',
    component: MyRegistrationsComponent,
    canActivate: [authGuard, roleGuard('participant')],
  },

  // Admin pages
  {
    path: 'admin/events',
    canActivate: [authGuard, roleGuard('admin')],
    children: [
      { path: '', component: AdminEventListComponent },
      { path: 'new', component: AdminEventFormComponent },
      { path: ':id/edit', component: AdminEventFormComponent },
      { path: ':id/participants', component: AdminParticipantsComponent },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'events' },
  { path: '**', redirectTo: 'events' },
];
