import { TestBed } from '@angular/core/testing';
import { Movie } from '../movie';
import { MovieCard } from './movie-card';

const base: Movie = {
  id: 1,
  title: 'Dune: Part Two',
  voteAverage: 8.24,
  posterPath: '/dune.jpg',
  releaseDate: '2024-02-27',
};

function render(movie: Movie) {
  const fixture = TestBed.createComponent(MovieCard);
  fixture.componentRef.setInput('movie', movie);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('MovieCard', () => {
  it('shows the title, the formatted date and the rating', () => {
    const { el } = render(base);

    expect(el.querySelector('.title')?.textContent).toContain('Dune: Part Two');
    expect(el.querySelector('.date')?.textContent).toContain('Feb 27, 2024');
    expect(el.querySelector('.badge')?.textContent).toContain('8.2');
  });

  it('loads the poster from TMDB', () => {
    const { el } = render(base);

    const img = el.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://image.tmdb.org/t/p/w185/dune.jpg');
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('shows a placeholder when there is no poster', () => {
    const { el } = render({ ...base, posterPath: null });

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.placeholder')).not.toBeNull();
  });

  it('falls back to the placeholder when the poster fails to load', () => {
    const { fixture, el } = render(base);

    el.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.placeholder')).not.toBeNull();
  });

  it('says so when there is no release date', () => {
    const { el } = render({ ...base, releaseDate: null });

    expect(el.querySelector('.date')?.textContent).toContain('No release date');
  });

  it('shows Not rated instead of a zero', () => {
    const { el } = render({ ...base, voteAverage: 0 });

    expect(el.querySelector('.badge')?.textContent).toContain('Not rated');
    expect(el.querySelector('.badge')?.textContent).not.toContain('0.0');
    expect(el.querySelector('.badge svg')).toBeNull();
  });

  it('rounds the rating to one decimal', () => {
    expect(
      render({ ...base, voteAverage: 7.46 }).el.querySelector('.badge')?.textContent,
    ).toContain('7.5');
    expect(render({ ...base, voteAverage: 9 }).el.querySelector('.badge')?.textContent).toContain(
      '9.0',
    );
  });

  it('leaves an odd date as it came', () => {
    const { el } = render({ ...base, releaseDate: '2024-02-31' });

    expect(el.querySelector('.date')?.textContent).toContain('2024-02-31');
  });

  it('updates when it is given another movie', () => {
    const { fixture, el } = render(base);

    fixture.componentRef.setInput('movie', { ...base, title: 'Civil War' });
    fixture.detectChanges();

    expect(el.querySelector('.title')?.textContent).toContain('Civil War');
  });
});
