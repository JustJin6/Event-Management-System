export type Role = 'admin' | 'participant';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  adminCode?: string;
}

// Event as returned by the API (registeredCount and seatsAvailable are calculated by the server).
export interface EventItem {
  eventId: string;
  title: string;
  description: string;
  date: string; // ISO 8601
  venue: string;
  capacity: number;
  registeredCount: number;
  seatsAvailable: number;
}

export interface EventInput {
  title: string;
  description: string;
  date: string; // ISO 8601
  venue: string;
  capacity: number;
}

// Sent live by the server whenever someone registers or cancels.
export interface SeatUpdate {
  eventId: string;
  capacity: number;
  registeredCount: number;
  seatsAvailable: number;
}

export interface Registration {
  registrationId: string;
  userId: string;
  eventId: string;
  registrationDate: string;
  status: 'registered' | 'cancelled';
}

export interface RegistrationResult {
  registration: Registration;
  seats: SeatUpdate;
}

export interface MyRegistration extends Registration {
  event: EventItem;
}

export interface Participant {
  registrationId: string;
  registrationDate: string;
  status: 'registered' | 'cancelled';
  user: { userId: string; name: string; email: string };
}
