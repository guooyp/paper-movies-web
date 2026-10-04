export type MoviesErrorKind = 'network' | 'server' | 'parsing' | 'unauthorized' | 'unknown';

function messageFor(kind: MoviesErrorKind, status?: number): string {
  switch (kind) {
    case 'network':
      return 'No internet connection. Check your network and try again.';
    case 'server':
      return `The server returned an error (${status}). Please try again.`;
    case 'parsing':
      return 'We received an unexpected response from the server.';
    case 'unauthorized':
      // A setup problem the user can't fix. The hint for the developer is logged.
      return "We can't load movies right now. Please try again later.";
    case 'unknown':
      return 'Something went wrong. Please try again.';
  }
}

/** Every failure the movies service can produce, with a message fit for the screen. */
export class MoviesError extends Error {
  constructor(
    readonly kind: MoviesErrorKind,
    readonly status?: number,
  ) {
    super(messageFor(kind, status));
    this.name = 'MoviesError';
  }
}
