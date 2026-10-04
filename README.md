# Paper Movies (web)

The Angular version of the movie list: popular movies from TMDB, rating chips and a title search. It does the same as the Flutter app: https://github.com/guooyp/paper-movies-flutter

## Run it

You need Node 22.

1. Copy `.env.example` to `.env` and put your TMDB API key in it.
2. `npm install`
3. `npm start`, then open http://localhost:4200

Run the tests with `npm test`. GitHub Actions runs the formatter check, the tests and a build on every push.

If `npm install` crashes with `Cannot read properties of null (reading 'edgesOut')`, that is a bug in npm 10.9. Use `npx npm@11 install` instead.

## Structure

```
src/app/movies/
  movies.service.ts     the only code that uses HttpClient
  movie-mapper.ts       parses and checks the API response
  filter-movies.ts      filters by rating and title
  movies-error.ts       the error types and their messages
  release-date.ts       formats the release date
  movies-page/          the screen
  movie-card/           one movie in the list
  rating-chips/         the filter chips
```

## How it works

`MoviesPage` loads the movies once through `MoviesService`. It keeps the movies, the search text and the selected rating in signals, and a `computed` signal gives the list shown on screen. Filtering and searching therefore never call the API again.

The search text goes through RxJS (`debounceTime(300)` and `distinctUntilChanged`) before the list uses it, so the list only filters when you stop typing. The box itself updates on every key.

## Decisions

**Same rules as the Flutter app.** The rating is a minimum: Bad is 4 and above, Good 6, Great 8 and Recommend 9. "All" is 0 instead of 2, so movies with no votes still show. It loads page 1 only, because the brief wants search to work on the local list.

**API key.** The app calls `/api/...` on its own server. `proxy.conf.js` forwards the call to TMDB and adds the key from `.env`, so the key never ends up in the browser code. This only works with `npm start`. A real deployment would need a small backend that does the same job.

**Strict parsing.** The API response is checked before it is used. Only the movie id is required. A missing poster, date or title gets a fallback, and a response that isn't the expected shape is reported as an error instead of showing a half-built list.

## Error handling and edge cases

- No internet, a timeout, a server error and a bad response each show a message with a "Try again" button.
- A rejected or missing API key shows the same plain message, and the console says to check `.env`.
- A movie with no poster shows a placeholder, and a missing date shows "No release date".
- Dates are shown as "Feb 27, 2024". Anything that isn't a real date is shown as it came.
- A search or filter with no results shows "No movies found".
- The totals stay hidden until the first load is done.
- It follows the system dark mode, and the chips and search box work with the keyboard and a screen reader.

## Tests

There are unit tests for the parser, the filter, the date formatter and the service (using a fake HTTP backend), and component tests for the page, the card and the chips, including the search debounce. I also ran the tests against a few deliberate bugs to check they fail when they should.
