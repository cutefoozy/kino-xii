import { Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, Subject, catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { ModalService } from '../../core/modal-service';
import { AuthService } from '../../core/auth-service';
import { Movie } from '../../core/models';
import { MoviesService } from '../../core/movies';

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styles: [`
    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-dropdown {
      animation: dropdownSlide 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class Navbar {
  modal = inject(ModalService);
  auth = inject(AuthService);
  private moviesService = inject(MoviesService);
  private host = inject(ElementRef);

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  userMenu = viewChild<ElementRef<HTMLElement>>('userMenu');
  menuOpen = signal(false);

  private query$ = new Subject<string>();
  query = signal('');
  searchTerm = signal('');
  searchState = signal<'idle' | 'loading' | 'results' | 'empty' | 'error'>('idle');
  results = signal<Movie[]>([]);

  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    const source = u.fullName?.trim() || u.username;
    const parts = source.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
  });

  displayName = computed(() => {
    const u = this.auth.user();
    return u ? u.fullName?.trim().split(/\s+/)[0] || u.username : '';
  });

  constructor() {
    this.query$
      .pipe(
        tap((raw) => {
          const q = raw.trim();
          this.searchTerm.set(q);
          this.searchState.set(q.length >= SEARCH_MIN_CHARS ? 'loading' : 'idle');
        }),
        debounceTime(SEARCH_DEBOUNCE_MS),
        map((raw) => raw.trim()),
        switchMap((q): Observable<{ q: string; data: Movie[] | 'error' | null }> =>
          q.length < SEARCH_MIN_CHARS
            ? of({ q, data: null })
            : this.moviesService.search(q).pipe(
                map((res) => ({ q, data: res.data })),
                catchError(() => of({ q, data: 'error' as const })),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ q, data }) => {
        if (q !== this.searchTerm()) return;
        if (data === null) {
          this.results.set([]);
          return;
        }
        if (data === 'error') {
          this.searchState.set('error');
          return;
        }
        this.results.set(data);
        this.searchState.set(data.length ? 'results' : 'empty');
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.query$.next(value);
  }

  clearSearch() {
    const input = this.searchInput()?.nativeElement;
    if (input) {
      input.value = '';
      input.focus();
    }
    this.query.set('');
    this.query$.next('');
  }

  retrySearch() {
    this.query$.next(this.query());
  }

  titleParts(title: string) {
    const term = this.searchTerm().toLowerCase();
    const i = term ? title.toLowerCase().indexOf(term) : -1;
    if (i === -1) return [{ text: title, match: true }];
    return [
      { text: title.slice(0, i), match: false },
      { text: title.slice(i, i + term.length), match: true },
      { text: title.slice(i + term.length), match: false },
    ].filter((p) => p.text);
  }

  kindLabel(kind: string) {
    return kind.charAt(0).toUpperCase() + kind.slice(1);
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null) {
    if (!this.userMenu()?.nativeElement.contains(target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuOpen.set(false);
    this.searchInput()?.nativeElement.blur();
  }

  toggleMenu() {
    this.searchInput()?.nativeElement.blur(); // closes the search panel
    this.menuOpen.set(!this.menuOpen());
  }

  logout() {
    this.menuOpen.set(false);
    this.auth.logout().subscribe({ error: () => {} });
  }
}