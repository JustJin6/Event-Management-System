import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { EventStore } from './core/event-store';
import { SocketService } from './core/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly socket = inject(SocketService);
  private readonly store = inject(EventStore);

  constructor() {
    // Whenever the user logs in or out, start or stop the live connection and the event list.
    effect(() => {
      const token = this.auth.token();
      untracked(() => {
        if (token) {
          this.socket.connect(token);
          this.store.load();
        } else {
          this.socket.disconnect();
          this.store.clear();
        }
      });
    });
  }
}
