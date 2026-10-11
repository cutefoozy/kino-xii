import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../../core/auth-service';
import { MoviesService } from '../../core/movies-service';
import { Hall, Movie, PreferredVenue, Session, VenueSessions } from '../../core/models';
import { nextDays } from '../../core/date-utils';
import { toErrorMessage } from '../../core/http-error';
import { SessionTicket } from '../../shared/session-ticket/session-ticket';

interface HallGroup { hall: Hall; sessions: Session[]; }
interface VenueGroup { venue: PreferredVenue; halls: HallGroup[]; }

@Component({
  selector: 'app-movie-detail',
  imports: [DatePipe, RouterLink, SessionTicket],
  templateUrl: './movie-detail.html',
})
export class MovieDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private moviesService = inject(MoviesService);
  private auth = inject(AuthService);

  private movieSub?: Subscription;
  private sessionsSub?: Subscription;

  readonly days = nextDays(7);

  slug = signal('');
  movie = signal<Movie | null>(null);
  movieLoading = signal(true);
  movieError = signal<'not-found' | 'failed' | null>(null);

  selectedDate = signal(this.days[0].dateStr);
  sessions = signal<VenueSessions[]>([]);
  sessionsLoading = signal(true);
  sessionsError = signal<string | null>(null);

  activeSessionId = signal<number | null>(null);

  notifying = signal(false);
  notified = signal(false);
  backdropLoaded = signal(false);
  notifyError = signal<string | null>(null);

  formatNames = computed(() => this.movie()?.formats.map((f) => f.name).join(', ') ?? '');

  /** Signed-in user is younger than the film's minimum age: session buttons are disabled. */
  isAgeRestricted = computed(() => {
    const age = this.auth.user()?.age;
    const minAge = this.movie()?.ageRating.minAge;
    return age != null && minAge != null && age < minAge;
  });

  restrictionMessage = computed(() => {
    const m = this.movie();
    return m ? `This film is rated ${m.ageRating.code}. You cannot buy tickets for it with this account.` : '';
  });

  venueGroups = computed<VenueGroup[]>(() =>
    this.sessions()
      .filter((vs) => vs.sessions.length > 0)
      .map((vs) => ({ venue: vs.venue, halls: this.groupByHall(vs.sessions) })),
  );

  /** Next day in the strip that has sessions, for the empty state's "way forward". */
  nextAvailableDate = computed(() => {
    const available = this.movie()?.availableDates ?? [];
    return this.days.map((d) => d.dateStr).find((d) => d > this.selectedDate() && available.includes(d)) ?? null;
  });

  ngOnInit() {
    this.destroyRef.onDestroy(() => {
      this.movieSub?.unsubscribe();
      this.sessionsSub?.unsubscribe();
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.slug.set(params.get('slug') ?? '');
      this.sessions.set([]);
      this.notified.set(false);
      this.notifyError.set(null);
      this.loadMovie();
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('session'));
      this.activeSessionId.set(Number.isInteger(id) && id > 0 ? id : null);
    });
  }

  loadMovie() {
    this.backdropLoaded.set(false);
    this.movieSub?.unsubscribe();
    this.movieError.set(null);
    this.movieLoading.set(true);
    this.movie.set(null);

    this.movieSub = this.moviesService.bySlug(this.slug()).subscribe({
      next: (res) => {
        this.movie.set(res.data);
        this.movieLoading.set(false);
        this.selectedDate.set(this.initialDate(res.data));
        if (!res.data.isComingSoon) this.loadSessions();
      },
      error: (err: HttpErrorResponse) => {
        this.movieError.set(err.status === 404 ? 'not-found' : 'failed');
        this.movieLoading.set(false);
      },
    });
  }

  loadSessions() {
    this.sessionsSub?.unsubscribe(); // cancel the previous request
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);

    this.sessionsSub = this.moviesService.sessions(this.slug(), this.selectedDate()).subscribe({
      next: (res) => {
        this.sessions.set(res.data);
        this.sessionsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.sessionsError.set(toErrorMessage(err, 'showtimes'));
        this.sessionsLoading.set(false);
      },
    });
  }

  selectDate(dateStr: string) {
    if (dateStr === this.selectedDate()) return;
    this.selectedDate.set(dateStr);
    this.loadSessions();
  }

  isDateAvailable(dateStr: string): boolean {
    const available = this.movie()?.availableDates;
    return !available || available.includes(dateStr);
  }

  openSession(session: Session) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: session.id },
      queryParamsHandling: 'merge',
    });
  }

  closeSeatModal() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  notify() {
    const movie = this.movie();
    if (!movie || this.notifying()) return;

    this.notifying.set(true);
    this.notifyError.set(null);

    this.moviesService
      .notify(movie.slug)
      .pipe(finalize(() => this.notifying.set(false)))
      .subscribe({
        next: (res) => this.notified.set(res.data.subscribed), // state comes from the server response
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) return; // login modal + replay is handled globally
          this.notifyError.set(err.error?.message ?? 'Could not save your request. Please try again.');
        },
      });
  }

  private groupByHall(sessions: Session[]): HallGroup[] {
    const halls = new Map<number, HallGroup>();
    [...sessions]
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .forEach((s) => {
        const group = halls.get(s.hall.id) ?? { hall: s.hall, sessions: [] };
        group.sessions.push(s);
        halls.set(s.hall.id, group);
      });
    return [...halls.values()].sort((a, b) => a.hall.name.localeCompare(b.hall.name));
  }

  private initialDate(movie: Movie): string {
    const inStrip = (movie.availableDates ?? [])
      .filter((d) => this.days.some((x) => x.dateStr === d))
      .sort();
    return inStrip[0] ?? this.days[0].dateStr;
  }
}