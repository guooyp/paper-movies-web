import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MovieCard } from '../movie-card/movie-card';
import { RatingChips } from '../rating-chips/rating-chips';
import { filterMovies } from '../filter-movies';
import { Movie } from '../movie';
import { MoviesError } from '../movies-error';
import { MoviesService } from '../movies.service';
import { ALL_RATINGS, RatingCategory } from '../rating-category';

export const SEARCH_DEBOUNCE_MS = 300;

type Status = 'loading' | 'ready' | 'failed';

@Component({
  selector: 'app-movies-page',
  imports: [MovieCard, RatingChips],
  templateUrl: './movies-page.html',
  styleUrl: './movies-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoviesPage {
  private readonly service = inject(MoviesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<Status>('loading');
  protected readonly error = signal<MoviesError | null>(null);
  private readonly movies = signal<readonly Movie[]>([]);
  private requestInFlight = false;

  protected readonly category = signal<RatingCategory>(ALL_RATINGS);
  protected readonly searching = signal(false);
  /** What is in the box right now. */
  protected readonly searchText = signal('');
  /** What we filter by: the text, once the user stops typing for a moment. */
  private readonly query = toSignal(
    toObservable(this.searchText).pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly visible = computed(() =>
    filterMovies(this.movies(), this.query(), this.category()),
  );

  private readonly searchField = viewChild<ElementRef<HTMLInputElement>>('searchField');

  constructor() {
    // Focus the box whenever it appears.
    effect(() => this.searchField()?.nativeElement.focus());
    this.load();
  }

  protected load(): void {
    if (this.requestInFlight) return;
    this.requestInFlight = true;
    this.status.set('loading');

    this.service
      .getMovies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movies) => {
          this.movies.set(movies);
          this.status.set('ready');
          this.requestInFlight = false;
        },
        error: (error: MoviesError) => {
          this.error.set(error);
          this.status.set('failed');
          this.requestInFlight = false;
        },
      });
  }

  protected toggleSearch(): void {
    const closing = this.searching();
    this.searching.set(!closing);
    if (closing) this.searchText.set('');
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchText.set('');
    this.searchField()?.nativeElement.focus();
  }
}
