import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { MovieSessionGroup, SessionsMeta, Session, SortOption } from '../../../core/models';
import { SessionCard } from '../../../shared/session-card/session-card';

@Component({
  selector: 'app-sessions-list',
  imports: [SessionCard],
  templateUrl: './sessions-list.html',
  host: { class: 'block min-w-0 flex-1' },
})

export class SessionsList {
  private host = inject(ElementRef);

  groups = input.required<MovieSessionGroup[]>();
  meta = input<SessionsMeta | null>(null);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  selectedSort = input<string>('time_asc');
  sorts = input<SortOption[]>([]);

  sortSelected = output<string>();
  pageSelected = output<number>();
  sessionClicked = output<Session>();
  retryClicked = output<void>();
  clearFiltersClicked = output<void>();

  sortOpen = signal(false);

  // Only used until /filter-options has loaded
  private readonly fallbackSorts: SortOption[] = [
    { id: 'time_asc', label: 'Showtime: earliest first' },
    { id: 'time_desc', label: 'Showtime: latest first' },
    { id: 'price_asc', label: 'Price: low to high' },
    { id: 'price_desc', label: 'Price: high to low' },
    { id: 'title_asc', label: 'Title: A-Z' },
  ];

  sortItems = computed(() => (this.sorts().length ? this.sorts() : this.fallbackSorts));

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null) {
    if (!this.host.nativeElement.contains(target as Node)) {
      this.sortOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.sortOpen.set(false);
  }

  currentSortLabel() {
    return this.sortItems().find((s) => s.id === this.selectedSort())?.label ?? 'Sort';
  }

  visiblePages(current: number, last: number): (number | '…')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, '…', last];
    if (current >= last - 2) return [1, '…', last - 2, last - 1, last];
    return [1, '…', current - 1, current, current + 1, '…', last];
  }
}