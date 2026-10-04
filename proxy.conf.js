/**
 * Dev server proxy. The app calls /api/... and this forwards it to TMDB with the
 * API key added on the way, so the key stays in .env on this machine and never
 * reaches the browser or the bundle.
 */
const apiKey = process.env.TMDB_API_KEY;

if (!apiKey) {
  console.warn('\nTMDB_API_KEY is not set. Copy .env.example to .env and add your key.\n');
}

function withApiKey(path, key = apiKey) {
  const url = new URL(path, 'http://localhost');
  url.pathname = url.pathname.replace(/^\/api/, '');
  if (key) url.searchParams.set('api_key', key);
  return url.pathname + url.search;
}

module.exports = {
  '/api': {
    target: 'https://api.themoviedb.org',
    changeOrigin: true,
    secure: true,
    // Vite's option (the dev server is built on it). A function given as
    // `pathRewrite` would be silently ignored.
    rewrite: (path) => withApiKey(path),
  },
};

module.exports.withApiKey = withApiKey;
