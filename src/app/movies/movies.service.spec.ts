import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Movie } from './movie';
import { MoviesError } from './movies-error';
import { MoviesService } from './movies.service';

const URL = '/api/3/discover/movie';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(MoviesService),
    http: TestBed.inject(HttpTestingController),
  };
}

/** Runs the request to completion and returns whichever way it ended. */
function run(service: MoviesService): { movies?: Movie[]; error?: MoviesError } {
  const result: { movies?: Movie[]; error?: MoviesError } = {};
  service.getMovies().subscribe({
    next: (movies) => (result.movies = movies),
    error: (error) => (result.error = error),
  });
  return result;
}

describe('MoviesService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the parsed movies on success', () => {
    const { service, http } = setup();
    const result = run(service);

    http
      .expectOne((r) => r.url === URL)
      .flush({
        results: [{ id: 1, title: 'Dune', vote_average: 8.2 }],
      });

    expect(result.movies).toEqual([
      { id: 1, title: 'Dune', voteAverage: 8.2, posterPath: null, releaseDate: null },
    ]);
  });

  it('asks for page one of the most popular movies', () => {
    const { service, http } = setup();
    run(service);

    const request = http.expectOne((r) => r.url === URL);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('sort_by')).toBe('popularity.desc');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('include_adult')).toBe('false');
    expect(request.request.params.get('language')).toBe('en-US');
    request.flush({ results: [] });
  });

  it('calls its own origin and never carries an API key from the browser', () => {
    const { service, http } = setup();
    run(service);

    const request = http.expectOne((r) => r.url === URL);

    // The dev proxy adds the key on the way to TMDB. If this ever fails, the
    // key has ended up somewhere it would ship in the bundle.
    expect(request.request.url.startsWith('/api/')).toBe(true);
    expect(request.request.params.has('api_key')).toBe(false);
    expect(request.request.urlWithParams).not.toContain('api_key');
    request.flush({ results: [] });
  });

  it('returns an empty list when the API has no movies', () => {
    const { service, http } = setup();
    const result = run(service);

    http.expectOne((r) => r.url === URL).flush({ results: [] });

    expect(result.movies).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  describe('failures', () => {
    for (const status of [400, 403, 404, 429, 500, 503]) {
      it(`reports a ${status} as a server error with the status`, () => {
        const { service, http } = setup();
        const result = run(service);

        http.expectOne((r) => r.url === URL).flush('nope', { status, statusText: 'Error' });

        expect(result.error).toBeInstanceOf(MoviesError);
        expect(result.error?.kind).toBe('server');
        expect(result.error?.status).toBe(status);
      });
    }

    it('reports a 401 as a missing or invalid key, not as a server fault', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { service, http } = setup();
      const result = run(service);

      http
        .expectOne((r) => r.url === URL)
        .flush({ status_message: 'Invalid API key' }, { status: 401, statusText: 'Unauthorized' });

      expect(result.error?.kind).toBe('unauthorized');
      expect(result.error?.message).not.toContain('TMDB_API_KEY');
    });

    it('logs a hint for the developer when the key is rejected', () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { service, http } = setup();
      run(service);

      http.expectOne((r) => r.url === URL).flush('', { status: 401, statusText: 'Unauthorized' });

      expect(log).toHaveBeenCalledTimes(1);
      expect(log.mock.calls[0][0]).toContain('TMDB_API_KEY');
      expect(log.mock.calls[0][0]).toContain('.env');
    });

    it('reports a request that never got an answer as a network error', () => {
      const { service, http } = setup();
      const result = run(service);

      http.expectOne((r) => r.url === URL).error(new ProgressEvent('error'));

      expect(result.error?.kind).toBe('network');
    });

    it('reports a request that takes too long as a network error', () => {
      vi.useFakeTimers();
      const { service, http } = setup();
      const result = run(service);
      http.expectOne((r) => r.url === URL);

      vi.advanceTimersByTime(15_001);

      expect(result.error?.kind).toBe('network');
    });

    it('does not time out a request that answers in time', () => {
      vi.useFakeTimers();
      const { service, http } = setup();
      const result = run(service);

      vi.advanceTimersByTime(14_000);
      http.expectOne((r) => r.url === URL).flush({ results: [] });
      vi.advanceTimersByTime(5_000);

      expect(result.movies).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    const malformed: Record<string, object> = {
      'an array': [],
      'no results': {},
      'results that is not a list': { results: 'nope' },
      'an item without an id': { results: [{ title: 'no id' }] },
      'a rating that is not a number': { results: [{ id: 1, vote_average: 'high' }] },
    };

    for (const [name, body] of Object.entries(malformed)) {
      it(`reports ${name} as a parsing error`, () => {
        const { service, http } = setup();
        const result = run(service);

        http.expectOne((r) => r.url === URL).flush(body);

        expect(result.error?.kind).toBe('parsing');
      });
    }

    it('reports an unreadable body as a parsing error', () => {
      const { service, http } = setup();
      const result = run(service);

      http.expectOne((r) => r.url === URL).flush('<html>oops</html>');

      expect(result.error?.kind).toBe('parsing');
    });

    it('can try again after a failure', () => {
      const { service, http } = setup();

      const first = run(service);
      http.expectOne((r) => r.url === URL).flush('', { status: 500, statusText: 'Error' });
      const second = run(service);
      http.expectOne((r) => r.url === URL).flush({ results: [{ id: 1, title: 'Dune' }] });

      expect(first.error?.kind).toBe('server');
      expect(second.movies).toHaveLength(1);
    });
  });
});
