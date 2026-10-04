import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { MoviesService } from './movies/movies.service';

describe('App', () => {
  it('shows the movie list and loads the movies', async () => {
    const getMovies = vi.fn(() =>
      of([{ id: 1, title: 'Dune', voteAverage: 8, posterPath: null, releaseDate: null }]),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: MoviesService, useValue: { getMovies } }],
    });

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(getMovies).toHaveBeenCalledTimes(1);
    expect(el.querySelector('h1')?.textContent).toBe('Movie List');
    expect(el.textContent).toContain('Dune');
  });
});
