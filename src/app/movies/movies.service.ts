import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';
import { parseMovies } from './movie-mapper';
import { Movie } from './movie';
import { MoviesError } from './movies-error';

/**
 * Same-origin on purpose: the dev server proxy (proxy.conf.js) forwards /api to
 * TMDB and adds the API key, so the key never ships in the browser bundle.
 */
const DISCOVER_URL = '/api/3/discover/movie';
const REQUEST_TIMEOUT_MS = 15_000;

function toMoviesError(error: unknown): Observable<never> {
  if (error instanceof MoviesError) return throwError(() => error);
  if (error instanceof TimeoutError) return throwError(() => new MoviesError('network'));
  if (error instanceof HttpErrorResponse) {
    // Status 0 means the request never got an answer: offline, DNS, CORS.
    if (error.status === 0) return throwError(() => new MoviesError('network'));
    if (error.status === 401) {
      console.error(
        'TMDB rejected the API key. Check TMDB_API_KEY in .env, then restart npm start.',
      );
      return throwError(() => new MoviesError('unauthorized'));
    }
    return throwError(() => new MoviesError('server', error.status));
  }
  return throwError(() => new MoviesError('unknown'));
}

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private readonly http = inject(HttpClient);

  /** Page 1 of the most popular movies. Errors are always a [MoviesError]. */
  getMovies(): Observable<Movie[]> {
    const params = new HttpParams({
      fromObject: {
        include_adult: 'false',
        include_video: 'false',
        language: 'en-US',
        page: '1',
        sort_by: 'popularity.desc',
      },
    });

    return this.http
      .get<unknown>(DISCOVER_URL, { params })
      .pipe(timeout(REQUEST_TIMEOUT_MS), map(parseMovies), catchError(toMoviesError));
  }
}
