import { MoviesError } from './movies-error';

describe('MoviesError', () => {
  it('is an Error carrying its kind', () => {
    const error = new MoviesError('network');

    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe('network');
    expect(error.name).toBe('MoviesError');
  });

  it('has a message written for the user for every kind', () => {
    expect(new MoviesError('network').message).toContain('internet');
    expect(new MoviesError('parsing').message).toContain('unexpected response');
    expect(new MoviesError('unknown').message).toContain('Something went wrong');
  });

  it('puts the status code in the server message', () => {
    const error = new MoviesError('server', 503);

    expect(error.status).toBe(503);
    expect(error.message).toContain('503');
  });

  it('keeps setup details out of the message for a rejected key', () => {
    const message = new MoviesError('unauthorized').message;

    expect(message).toContain('try again later');
    expect(message).not.toContain('TMDB_API_KEY');
    expect(message).not.toContain('.env');
  });
});
