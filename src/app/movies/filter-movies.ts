import { Movie } from './movie';
import { RatingCategory } from './rating-category';

export function filterMovies(
  movies: readonly Movie[],
  query: string,
  category: RatingCategory,
): Movie[] {
  const needle = query.trim().toLowerCase();
  return movies.filter(
    (movie) =>
      movie.voteAverage >= category.minRating &&
      (needle === '' || movie.title.toLowerCase().includes(needle)),
  );
}
