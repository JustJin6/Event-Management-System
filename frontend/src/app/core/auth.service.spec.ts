import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from './models';

const adminResponse: AuthResponse = {
  token: 'jwt-token',
  user: { userId: 'u1', name: 'Ann', email: 'ann@example.com', role: 'admin' },
};

const testRoutes: Routes = [
  { path: 'login', redirectTo: '', pathMatch: 'full' },
];

function setup(): { auth: AuthService; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(testRoutes)],
  });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
}

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());

  it('starts logged out', () => {
    const { auth } = setup();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('stores the session after a successful login', () => {
    const { auth, http } = setup();
    auth.login('ann@example.com', 'secret123').subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ann@example.com', password: 'secret123' });
    req.flush(adminResponse);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(auth.homeUrl()).toBe('/admin/events');
    expect(localStorage.getItem('ems_token')).toBe('jwt-token');
  });

  it('sends participants to the events page', () => {
    const { auth, http } = setup();
    auth.register({ name: 'Bob', email: 'bob@example.com', password: 'secret123' }).subscribe();
    http.expectOne('/api/auth/register').flush({
      token: 't',
      user: { userId: 'u2', name: 'Bob', email: 'bob@example.com', role: 'participant' },
    } satisfies AuthResponse);
    expect(auth.isAdmin()).toBe(false);
    expect(auth.homeUrl()).toBe('/events');
  });

  it('clears the session on logout', () => {
    const { auth, http } = setup();
    auth.login('ann@example.com', 'secret123').subscribe();
    http.expectOne('/api/auth/login').flush(adminResponse);

    auth.logout();

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('ems_token')).toBeNull();
  });
});
