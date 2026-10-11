import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { FilterOptionsService } from '../../core/filter-options-service';
import { SessionsService, SessionsFilterParams } from '../../core/sessions-service';
import { MovieSessionGroup, SessionsMeta, Session, SessionsResponse } from '../../core/models';
import { toDateStr } from '../../core/date-utils';
import { FiltersSidebar } from './filters-sidebar/filters-sidebar';
import { SessionsList } from './sessions-list/sessions-list';

@Component({
  selector: 'app-sessions',
  imports: [FiltersSidebar, SessionsList],
  templateUrl: './sessions.html',
})
export class Sessions implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private sessionsService = inject(SessionsService);
  filterOptionsService = inject(FilterOptionsService);

  private requestSub?: Subscription;

  selectedVenues = signal<string[]>([]);
  selectedDate = signal<string>('');
  selectedFormats = signal<string[]>([]);
  selectedLanguages = signal<string[]>([]);
  selectedBands = signal<string[]>([]);
  selectedSort = signal<string>('time_asc');
  currentPage = signal<number>(1);

  groups = signal<MovieSessionGroup[]>([]);
  meta = signal<SessionsMeta | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.filterOptionsService.load();
    this.destroyRef.onDestroy(() => this.requestSub?.unsubscribe());

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.parseUrlParams(params);
        this.fetchSessions();
      });
  }

  private parseUrlParams(params: Record<string, any>) {
    const parseArray = (key: string): string[] => {
      const val = params[key] || params[`${key}[]`];
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val.split(',').map((s: string) => s.trim()).filter(Boolean);
    };

    this.selectedVenues.set(parseArray('venue').length ? parseArray('venue') : parseArray('venues'));
    this.selectedFormats.set(parseArray('format').length ? parseArray('format') : parseArray('formats'));
    this.selectedLanguages.set(parseArray('language').length ? parseArray('language') : parseArray('languages'));
    this.selectedBands.set(parseArray('band').length ? parseArray('band') : parseArray('bands'));

    const rawDate = params['date'] ?? '';
    this.selectedDate.set(/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : toDateStr(new Date()));
    this.selectedSort.set(params['sort'] || 'time_asc');
    this.currentPage.set(Math.max(1, parseInt(params['page'], 10) || 1));
  }

  private syncUrl(resetPage = true) {
    const queryParams: Record<string, any> = {};

    if (this.selectedVenues().length) queryParams['venue'] = this.selectedVenues().join(',');
    if (this.selectedDate()) queryParams['date'] = this.selectedDate();
    if (this.selectedFormats().length) queryParams['format'] = this.selectedFormats().join(',');
    if (this.selectedLanguages().length) queryParams['language'] = this.selectedLanguages().join(',');
    if (this.selectedBands().length) queryParams['band'] = this.selectedBands().join(',');
    if (this.selectedSort() !== 'time_asc') queryParams['sort'] = this.selectedSort();

    const page = resetPage ? 1 : this.currentPage();
    if (page > 1) queryParams['page'] = page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  fetchSessions() {
    this.requestSub?.unsubscribe(); // cancel the previous request
    this.loading.set(true);
    this.error.set(null);

    const query: SessionsFilterParams = {
      date: this.selectedDate(),
      venues: this.selectedVenues(),
      formats: this.selectedFormats(),
      languages: this.selectedLanguages(),
      bands: this.selectedBands(),
      sort: this.selectedSort(),
      page: this.currentPage(),
    };

    this.requestSub = this.sessionsService.list(query).subscribe({
      next: (res: SessionsResponse) => {
        // page beyond the last page (e.g. old URL): go back to page 1
        const last = Math.max(res.meta.lastPage, 1);
        if (this.currentPage() > 1 && this.currentPage() > last) {
          this.currentPage.set(1);
          this.syncUrl(true);
          return;
        }
        this.groups.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.toMessage(err));
        this.loading.set(false);
      },
    });
  }

  private toMessage(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (err.status === 422 && err.error?.message) return err.error.message;
    return 'Something went wrong while loading showtimes.';
  }

  onToggleVenue(slug: string) {
    const current = this.selectedVenues();
    const next = current.includes(slug) ? current.filter((v) => v !== slug) : [...current, slug];
    this.selectedVenues.set(next);

    const opts = this.filterOptionsService.options();
    if (opts && next.length > 0) {
      const allowed = new Set<string>();
      opts.venues
        .filter((v) => next.includes(v.slug))
        .forEach((v) => v.formats?.forEach((f) => allowed.add(f.slug)));

      this.selectedFormats.set(this.selectedFormats().filter((f) => allowed.has(f)));
    }

    this.syncUrl(true);
  }

  onSelectDate(dateStr: string) {
    this.selectedDate.set(dateStr);
    this.syncUrl(true);
  }

  onToggleFormat(slug: string) {
    const current = this.selectedFormats();
    this.selectedFormats.set(current.includes(slug) ? current.filter((f) => f !== slug) : [...current, slug]);
    this.syncUrl(true);
  }

  onToggleLanguage(slug: string) {
    const current = this.selectedLanguages();
    this.selectedLanguages.set(current.includes(slug) ? current.filter((l) => l !== slug) : [...current, slug]);
    this.syncUrl(true);
  }

  onToggleBand(id: string) {
    const current = this.selectedBands();
    this.selectedBands.set(current.includes(id) ? current.filter((b) => b !== id) : [...current, id]);
    this.syncUrl(true);
  }

  onClearFilters() {
    this.selectedVenues.set([]);
    this.selectedFormats.set([]);
    this.selectedLanguages.set([]);
    this.selectedBands.set([]);
    this.syncUrl(true);
  }

  onSelectSort(sortId: string) {
    this.selectedSort.set(sortId);
    this.syncUrl(true);
  }

  onSelectPage(page: number) {
    this.currentPage.set(page);
    this.syncUrl(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSessionClicked(session: Session) {
    this.router.navigate(['/movies', session.movie.slug], {
      queryParams: { session: session.id },
    });
  }
}