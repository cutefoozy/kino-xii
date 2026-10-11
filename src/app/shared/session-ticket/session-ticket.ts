import { Component, computed, input, output } from '@angular/core';
import { Session } from '../../core/models';

@Component({
  selector: 'app-session-ticket',
  host: { class: 'block' },
  template: `
    @let s = session();
    <button type="button" [disabled]="isDisabled()" (click)="selected.emit(s)"
      [attr.title]="restricted() ? restrictedReason() : null"
      class="relative flex h-20 w-full rounded-xl bg-bg text-left outline-none transition-all
             enabled:cursor-pointer enabled:hover:bg-[#0C1226] enabled:active:scale-[0.98]
             disabled:cursor-not-allowed disabled:opacity-40">

      <span class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5"
        [class]="compact() ? 'px-2' : 'px-5'">
        <span class="text-xl font-extrabold leading-none tabular-nums text-white">{{ time() }}</span>
        <span class="flex items-center whitespace-nowrap uppercase text-[#A9A9A9]"
          [class]="compact() ? 'gap-1.5 text-[11px]' : 'gap-2 text-xs'">
          {{ s.language.code }}
          <span class="rounded-full bg-[[#1E2031]] py-1 font-semibold leading-none"
            [class]="compact() ? 'px-2' : 'px-3'">{{ s.format.name }}</span>
        </span>
      </span>

      <span class="relative w-0" aria-hidden="true">
        <span class="absolute left-0 top-4 h-12 w-0.5 bg-[repeating-linear-gradient(to_bottom,#fff_0_3px,transparent_3px_7.5px)]"></span>
        <span class="absolute -left-1.5 -top-[7px] h-3.5 w-3.5 rounded-full bg-[#1E2031]"></span>
        <span class="absolute -bottom-[7px] -left-1.5 h-3.5 w-3.5 rounded-full bg-[#1E2031]"></span>
      </span>

      <span class="flex w-20.5 shrink-0 flex-col items-center justify-center gap-2.5">
        @if (s.price != null) {
          <span class="text-lg font-extrabold leading-none text-[#EC3013]"><span class="mr-0.5">₾</span>{{ s.price }}</span>
        }
        @if (isSoldOut()) {
          <span class="text-xs text-[#A9A9A9]">Sold out</span>
        } @else if (seatsLeft() !== null) {
          <span class="flex items-center gap-1 whitespace-nowrap text-xs" [class]="isLowSeats() ? 'text-[#EC3013]' : 'text-[#A9A9A9]'">
            <img src="Ticket-Grey.svg" alt="" class="h-3 w-3" />
            {{ seatsLeft() }} left
          </span>
        }
      </span>
    </button>
  `,
})
export class SessionTicket {
  session = input.required<Session>();
  restricted = input(false);
  restrictedReason = input('');
  selected = output<Session>();

  isSoldOut = computed(() => !!this.session().isSoldOut);
  isDisabled = computed(() => this.isSoldOut() || this.restricted());
  seatsLeft = computed(() => this.session().seatsLeft ?? null);
  isLowSeats = computed(() => {
    const n = this.seatsLeft();
    return n !== null && n <= 5;
  });
  compact = computed(() => this.session().format.name.length > 5);
  time = computed(() => this.session().time?.slice(0, 5) ?? '');
}