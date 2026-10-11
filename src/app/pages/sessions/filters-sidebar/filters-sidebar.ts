import { Component, computed, input, output } from '@angular/core';
import { FilterOptions, Format, TimeBand } from '../../../core/models';
import { toDateStr } from '../../../core/date-utils';
import { CheckboxOption } from '../../../shared/checkbox-option/checkbox-option';

export interface DayOption {
  dateStr: string;
  dayName: string;
  dayNumber: string;
}

@Component({
  selector: 'app-filters-sidebar',
  imports: [CheckboxOption],
  templateUrl: './filters-sidebar.html',
  host: { class: 'block w-full shrink-0 lg:w-[320px]' },
})
export class FiltersSidebar {
  options = input<FilterOptions | null>(null);
  selectedVenues = input<string[]>([]);
  selectedDate = input<string>('');
  selectedFormats = input<string[]>([]);
  selectedLanguages = input<string[]>([]);
  selectedBands = input<string[]>([]);
  loading = input<boolean>(false);
  error = input<boolean>(false);

  venueToggled = output<string>();
  dateSelected = output<string>();
  formatToggled = output<string>();
  languageToggled = output<string>();
  bandToggled = output<string>();
  filtersCleared = output<void>();
  retryClicked = output<void>();

  days = computed<DayOption[]>(() => {
    const list: DayOption[] = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      list.push({
        dateStr: toDateStr(d),
        dayName: dayNames[d.getDay()],
        dayNumber: String(d.getDate()),
      });
    }
    return list;
  });

  visibleFormats = computed<Format[]>(() => {
    const opts = this.options();
    if (!opts) return [];
    const all = opts.formats || [];
    const venues = this.selectedVenues();

    if (venues.length === 0) return all;

    const chosen = opts.venues.filter((v) => venues.includes(v.slug));
    const availableSlugs = new Set<string>();
    chosen.forEach((v) => v.formats?.forEach((f) => availableSlugs.add(f.slug)));

    return all.filter((f) => availableSlugs.has(f.slug));
  });

  activeCount = computed(() => {
    return (
      this.selectedVenues().length +
      this.selectedFormats().length +
      this.selectedLanguages().length +
      this.selectedBands().length
    );
  });

  private readonly bandHints: Record<string, string> = {
    morning: 'before 12:00',
    afternoon: '12:00–18:00',
    evening: 'after 18:00',
  };

  bandHint(band: TimeBand): string {
    return band.hint ?? this.bandHints[band.id] ?? '';
  }

  formatBandLabel(label: string): string {
    return label.split(' (')[0];
  }
}