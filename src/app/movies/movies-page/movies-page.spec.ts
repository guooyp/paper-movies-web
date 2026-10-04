import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Movie } from '../movie';
import { MoviesError } from '../movies-error';
import { MoviesService } from '../movies.service';
import { MoviesPage, SEARCH_DEBOUNCE_MS } from './movies-page';

const movie = (id: number, title: string, voteAverage: number): Movie => ({
  id,
  title,
  voteAverage,
  posterPath: null,
  releaseDate: '2024-02-27',
});

const MOVIES = [
  movie(1, 'Dune: Part Two', 8.2),
  movie(2, 'Civil War', 4.5),
  movie(3, 'The Fall Guy', 7),
  movie(4, 'Dune', 8.8),
];

function setup(getMovies: () => Observable<Movie[]> = () => of(MOVIES)) {
  const getMoviesSpy = vi.fn(getMovies);
  TestBed.configureTestingModule({
    providers: [{ provide: MoviesService, useValue: { getMovies: getMoviesSpy } }],
  });
  const fixture = TestBed.createComponent(MoviesPage);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;

  return {
    fixture,
    el,
    getMovies: getMoviesSpy,
    titles: () =>
      [...el.querySelectorAll('app-movie-card .title')].map((t) => t.textContent?.trim()),
    totals: () => el.querySelector('.filter-header')?.textContent?.match(/Totals = (\d+)/)?.[1],
    chip: (name: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('.chip')].find(
        (c) => c.textContent?.trim() === name,
      )!,
    searchButton: () => el.querySelector<HTMLButtonElement>('.bar .icon-button')!,
    searchInput: () => el.querySelector<HTMLInputElement>('.search input'),
    text: () => el.textContent ?? '',
    type(value: string) {
      const input = el.querySelector<HTMLInputElement>('.search input')!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    },
    wait(ms: number) {
      vi.advanceTimersByTime(ms);
      fixture.detectChanges();
    },
    click(button: HTMLElement) {
      button.click();
      fixture.detectChanges();
    },
  };
}

describe('MoviesPage', () => {
  afterEach(() => vi.useRealTimers());

  describe('loading', () => {
    it('shows a spinner and no total while the request is running', () => {
      const { el, totals } = setup(() => new Subject<Movie[]>());

      expect(el.querySelector('.spinner')).not.toBeNull();
      expect(el.querySelector('[role="status"]')?.textContent).toContain('Loading movies');
      expect(totals()).toBeUndefined();
    });

    it('asks for the movies once, when it opens', () => {
      const { getMovies } = setup();

      expect(getMovies).toHaveBeenCalledTimes(1);
    });

    it('lists the movies and the total once they arrive', () => {
      const { el, titles, totals } = setup();

      expect(titles()).toEqual(['Dune: Part Two', 'Civil War', 'The Fall Guy', 'Dune']);
      expect(totals()).toBe('4');
      expect(el.querySelector('.spinner')).toBeNull();
    });

    it('swaps the spinner for the list when the response comes in late', () => {
      const response = new Subject<Movie[]>();
      const { fixture, el, titles } = setup(() => response);

      response.next(MOVIES);
      fixture.detectChanges();

      expect(el.querySelector('.spinner')).toBeNull();
      expect(titles()).toHaveLength(4);
    });
  });

  describe('failure', () => {
    const failing = () => throwError(() => new MoviesError('network'));

    it('shows the error message and a retry button', () => {
      const { el, totals } = setup(failing);

      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No internet connection');
      expect(el.querySelector('.outlined')?.textContent).toContain('Try again');
      expect(totals()).toBeUndefined();
    });

    it('uses the message of whatever went wrong', () => {
      const { text } = setup(() => throwError(() => new MoviesError('server', 503)));

      expect(text()).toContain('503');
    });

    it('retries, and shows the movies when the second attempt works', () => {
      let attempt = 0;
      const { el, click, titles, getMovies } = setup(() =>
        attempt++ === 0 ? throwError(() => new MoviesError('network')) : of(MOVIES),
      );

      click(el.querySelector<HTMLButtonElement>('.outlined')!);

      expect(getMovies).toHaveBeenCalledTimes(2);
      expect(titles()).toHaveLength(4);
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('can fail again and offer another retry', () => {
      const { el, click, getMovies } = setup(failing);

      click(el.querySelector<HTMLButtonElement>('.outlined')!);
      click(el.querySelector<HTMLButtonElement>('.outlined')!);

      expect(getMovies).toHaveBeenCalledTimes(3);
      expect(el.querySelector('.outlined')).not.toBeNull();
    });

    it('still shows the filter chips', () => {
      const { el } = setup(failing);

      expect(el.querySelectorAll('.chip')).toHaveLength(5);
    });
  });

  describe('empty', () => {
    it('says so when the API returns nothing', () => {
      const { text, totals } = setup(() => of([]));

      expect(text()).toContain('No movies found');
      expect(totals()).toBe('0');
    });
  });

  describe('rating filter', () => {
    it('starts on All', () => {
      const { chip } = setup();

      expect(chip('All').getAttribute('aria-pressed')).toBe('true');
    });

    it('filters the list and the total by the chip tapped', () => {
      const { chip, click, titles, totals } = setup();

      click(chip('Great'));

      expect(titles()).toEqual(['Dune: Part Two', 'Dune']);
      expect(totals()).toBe('2');
      expect(chip('Great').getAttribute('aria-pressed')).toBe('true');
      expect(chip('All').getAttribute('aria-pressed')).toBe('false');
    });

    it('does not fetch again when the filter changes', () => {
      const { chip, click, getMovies } = setup();

      click(chip('Good'));
      click(chip('Great'));
      click(chip('All'));

      expect(getMovies).toHaveBeenCalledTimes(1);
    });

    it('brings everything back on All', () => {
      const { chip, click, titles } = setup();

      click(chip('Recommend'));
      click(chip('All'));

      expect(titles()).toHaveLength(4);
    });

    it('shows the empty message when nothing is rated that high', () => {
      const { chip, click, text, totals } = setup();

      click(chip('Recommend'));

      expect(text()).toContain('No movies found');
      expect(totals()).toBe('0');
    });
  });

  describe('search', () => {
    beforeEach(() => vi.useFakeTimers());

    it('is closed until the search button is pressed', () => {
      const { searchInput } = setup();

      expect(searchInput()).toBeNull();
    });

    it('opens and focuses the box', () => {
      const { searchButton, click, searchInput } = setup();

      click(searchButton());

      expect(searchInput()).not.toBeNull();
      expect(document.activeElement).toBe(searchInput());
      expect(searchButton().getAttribute('aria-expanded')).toBe('true');
    });

    it('filters by title once the user stops typing', () => {
      const { searchButton, click, type, wait, titles, totals } = setup();
      click(searchButton());

      type('dune');
      wait(SEARCH_DEBOUNCE_MS);

      expect(titles()).toEqual(['Dune: Part Two', 'Dune']);
      expect(totals()).toBe('2');
    });

    it('waits for a pause before filtering', () => {
      const { searchButton, click, type, wait, titles } = setup();
      click(searchButton());

      type('civil');
      wait(SEARCH_DEBOUNCE_MS - 50);

      expect(titles()).toHaveLength(4);

      wait(50);
      expect(titles()).toEqual(['Civil War']);
    });

    it('only applies the last thing typed', () => {
      const { searchButton, click, type, wait, titles } = setup();
      click(searchButton());

      type('c');
      wait(100);
      type('ci');
      wait(100);
      type('civ');
      wait(SEARCH_DEBOUNCE_MS);

      expect(titles()).toEqual(['Civil War']);
    });

    it('ignores case and spaces around the text', () => {
      const { searchButton, click, type, wait, titles } = setup();
      click(searchButton());

      type('  FALL ');
      wait(SEARCH_DEBOUNCE_MS);

      expect(titles()).toEqual(['The Fall Guy']);
    });

    it('combines with the rating filter', () => {
      const { searchButton, chip, click, type, wait, titles } = setup();
      click(searchButton());

      click(chip('Great'));
      type('dune');
      wait(SEARCH_DEBOUNCE_MS);
      expect(titles()).toEqual(['Dune: Part Two', 'Dune']);

      type('part');
      wait(SEARCH_DEBOUNCE_MS);
      expect(titles()).toEqual(['Dune: Part Two']);
    });

    it('shows the empty message when nothing matches', () => {
      const { searchButton, click, type, wait, text, totals } = setup();
      click(searchButton());

      type('test');
      wait(SEARCH_DEBOUNCE_MS);

      expect(text()).toContain('No movies found');
      expect(totals()).toBe('0');
    });

    it('shows a clear button only when there is text', () => {
      const { el, searchButton, click, type } = setup();
      click(searchButton());
      expect(el.querySelector('.clear')).toBeNull();

      type('d');

      expect(el.querySelector('.clear')).not.toBeNull();
    });

    it('clearing empties the box and brings every movie back', () => {
      const { el, searchButton, click, type, wait, titles, searchInput } = setup();
      click(searchButton());
      type('civil');
      wait(SEARCH_DEBOUNCE_MS);

      click(el.querySelector<HTMLElement>('.clear')!);
      wait(SEARCH_DEBOUNCE_MS);

      expect(searchInput()!.value).toBe('');
      expect(titles()).toHaveLength(4);
      expect(el.querySelector('.clear')).toBeNull();
    });

    it('closing the search forgets the text', () => {
      const { searchButton, click, type, wait, titles, searchInput } = setup();
      click(searchButton());
      type('civil');
      wait(SEARCH_DEBOUNCE_MS);

      click(searchButton());
      wait(SEARCH_DEBOUNCE_MS);

      expect(searchInput()).toBeNull();
      expect(titles()).toHaveLength(4);
    });

    it('Escape closes it', () => {
      const { fixture, searchButton, click, searchInput } = setup();
      click(searchButton());

      searchInput()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(searchInput()).toBeNull();
    });

    it('does not fetch again when searching', () => {
      const { searchButton, click, type, wait, getMovies } = setup();
      click(searchButton());

      type('dune');
      wait(SEARCH_DEBOUNCE_MS);

      expect(getMovies).toHaveBeenCalledTimes(1);
    });

    it('keeps the search when the rating changes afterwards', () => {
      const { searchButton, chip, click, type, wait, titles } = setup();
      click(searchButton());
      type('dune');
      wait(SEARCH_DEBOUNCE_MS);

      click(chip('Great'));

      expect(titles()).toEqual(['Dune: Part Two', 'Dune']);
    });
  });

  describe('accessibility', () => {
    it('has one main landmark and one h1', () => {
      const { el } = setup();

      expect(el.querySelectorAll('main')).toHaveLength(1);
      expect(el.querySelector('h1')?.textContent).toBe('Movie List');
    });

    it('names the search button for what it will do', () => {
      const { searchButton, click } = setup();

      expect(searchButton().getAttribute('aria-label')).toBe('Search');
      click(searchButton());
      expect(searchButton().getAttribute('aria-label')).toBe('Close search');
    });

    it('lists the movies as a list', () => {
      const { el } = setup();

      expect(el.querySelectorAll('ul.list > li')).toHaveLength(4);
    });

    it('announces the total when it changes', () => {
      const { el } = setup();

      expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Totals = 4');
    });
  });
});
