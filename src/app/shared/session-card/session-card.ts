import { Component, computed, input, output } from '@angular/core';
import { Session } from '../../core/models';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.html',
  host: { class: 'block w-[252px] shrink-0' },
})
export class SessionCard {
  session = input.required<Session>();
  selected = output<Session>();

  isSoldOut = computed(() => !!this.session().isSoldOut);
  seatsLeft = computed(() => this.session().seatsLeft ?? null);
  isLowSeats = computed(() => {
    const n = this.seatsLeft();
    return n !== null && n <= 5;
  });
  time = computed(() => this.session().time?.slice(0, 5) ?? '');
}