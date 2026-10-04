import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Movie } from '../movie';
import { formatReleaseDate } from '../release-date';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

@Component({
  selector: 'app-movie-card',
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieCard {
  readonly movie = input.required<Movie>();

  private readonly posterFailed = signal(false);

  protected readonly posterUrl = computed(() => {
    const path = this.movie().posterPath;
    return path && !this.posterFailed() ? `${IMAGE_BASE_URL}${path}` : null;
  });

  protected readonly date = computed(
    () => formatReleaseDate(this.movie().releaseDate) ?? 'No release date',
  );

  protected readonly rated = computed(() => this.movie().voteAverage > 0);

  protected readonly rating = computed(() => this.movie().voteAverage.toFixed(1));

  protected onPosterError(): void {
    this.posterFailed.set(true);
  }
}
