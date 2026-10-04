export interface Movie {
  readonly id: number;
  readonly title: string;
  readonly voteAverage: number;
  readonly posterPath: string | null;
  readonly releaseDate: string | null;
}
