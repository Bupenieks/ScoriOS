const SpotifyRoutes = require('./spotify_routes.js');

module.exports = (app ,db) => {
    SpotifyRoutes(app, db);
}