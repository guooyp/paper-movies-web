import { parseMovies } from './movie-mapper';
import { MoviesError } from './movies-error';

function parse(results: unknown[]) {
  return parseMovies({ results });
}

describe('parseMovies', () => {
  it('parses a complete movie', () => {
    const [movie] = parse([
      {
        id: 10,
        title: 'Dune: Part Two',
        poster_path: '/dune.jpg',
        release_date: '2024-02-27',
        vote_average: 8.2,
      },
    ]);

    expect(movie).toEqual({
      id: 10,
      title: 'Dune: Part Two',
      posterPath: '/dune.jpg',
      releaseDate: '2024-02-27',
      voteAverage: 8.2,
    });
  });

  it('keeps the order the API returned', () => {
    expect(parse([{ id: 3 }, { id: 1 }, { id: 2 }]).map((m) => m.id)).toEqual([3, 1, 2]);
  });

  it('returns an empty list when results is empty', () => {
    expect(parse([])).toEqual([]);
  });

  it('accepts an integer vote_average', () => {
    expect(parse([{ id: 1, vote_average: 7 }])[0].voteAverage).toBe(7);
  });

  it('treats null and blank optional fields as missing', () => {
    const [movie] = parse([
      { id: 1, title: 'A', poster_path: null, release_date: '  ', vote_average: null },
    ]);

    expect(movie.posterPath).toBeNull();
    expect(movie.releaseDate).toBeNull();
    expect(movie.voteAverage).toBe(0);
  });

  it('defaults a missing rating to 0', () => {
    expect(parse([{ id: 1 }])[0].voteAverage).toBe(0);
  });

  it('falls back to original_title, then to a placeholder', () => {
    const [withOriginal, withNothing, blank] = parse([
      { id: 1, title: '', original_title: 'Un père idéal' },
      { id: 2, title: null },
      { id: 3, title: '   ', original_title: '  ' },
    ]);

    expect(withOriginal.title).toBe('Un père idéal');
    expect(withNothing.title).toBe('Untitled');
    expect(blank.title).toBe('Untitled');
  });

  it('trims surrounding whitespace', () => {
    expect(parse([{ id: 1, title: '  Dune  ' }])[0].title).toBe('Dune');
  });

  it('ignores fields it does not know about', () => {
    expect(() => parse([{ id: 1, something_new: { nested: true } }])).not.toThrow();
  });

  describe('rejects a response that is not what we expect', () => {
    const cases: Record<string, unknown> = {
      'a JSON array': [],
      null: null,
      'a string': 'nope',
      'a number': 42,
      'an object without results': {},
      'results that is null': { results: null },
      'results that is not a list': { results: 'nope' },
      'an item that is not an object': { results: [1, 2] },
      'an item that is null': { results: [null] },
      'an item without an id': { results: [{ title: 'no id' }] },
      'an id that is a string': { results: [{ id: '1' }] },
      'an id that is not an integer': { results: [{ id: 1.5 }] },
      'a rating that is a string': { results: [{ id: 1, vote_average: 'high' }] },
    };

    for (const [name, body] of Object.entries(cases)) {
      it(`throws a parsing error for ${name}`, () => {
        let thrown: unknown;
        try {
          parseMovies(body);
        } catch (error) {
          thrown = error;
        }

        expect(thrown).toBeInstanceOf(MoviesError);
        expect((thrown as MoviesError).kind).toBe('parsing');
      });
    }
  });
});
