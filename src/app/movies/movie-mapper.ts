import { Movie } from './movie';
import { MoviesError } from './movies-error';

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonBlank(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function toMovie(item: unknown): Movie {
  // Only the id is required. TMDB sends null or empty strings for plenty else.
  if (!isObject(item) || !Number.isInteger(item['id'])) {
    throw new MoviesError('parsing');
  }

  const rating = item['vote_average'];
  if (rating !== undefined && rating !== null && typeof rating !== 'number') {
    throw new MoviesError('parsing');
  }

  return {
    id: item['id'] as number,
    title: nonBlank(item['title']) ?? nonBlank(item['original_title']) ?? 'Untitled',
    voteAverage: rating ?? 0,
    posterPath: nonBlank(item['poster_path']),
    releaseDate: nonBlank(item['release_date']),
  };
}

/** Turns the discover response into movies, or throws a parsing [MoviesError]. */
export function parseMovies(body: unknown): Movie[] {
  if (!isObject(body) || !Array.isArray(body['results'])) {
    throw new MoviesError('parsing');
  }
  return body['results'].map(toMovie);
}
