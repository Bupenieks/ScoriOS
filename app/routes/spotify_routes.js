const request = require('request'),
      querystring = require('querystring'),
      cookieParser = require('cookie-parser');

const client_id = '20f258f35cb34ca0b81df6f83e31f5c7',
      client_secret = '607766233014482786aa701cc39a3bca',
      redirect_uri = 'localhost:3000/callback';

const generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

let access_token = null,
    refresh_token = null,
    authorization_header = null;

module.exports = (app, db) => {

    app.use(cookieParser());

    app.get('/login', function (req, res) {
        let state = generateRandomString(16);
        res.cookie(stateKey, state);

        // your application requests authorization
        let scope = 'user-read-private user-read-email';
        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state
            }));
    });

    app.get('/callback', function (req, res) {

        // your application requests refresh and access tokens
        // after checking the state parameter

        let code = req.query.code || null;
        let state = req.query.state || null;
        let storedState = req.cookies ? req.cookies[stateKey] : null;

        if (state === null || state !== storedState) {
            res.redirect('/#' +
                querystring.stringify({
                    error: 'state_mismatch'
                }));
        } else {
            res.clearCookie(stateKey);
            let authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    code: code,
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code'
                },
                headers: {
                    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
                },
                json: true
            };

            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    access_token = body.access_token
                    refresh_token = body.refresh_token;
                    authorization_header = {'Authorization': 'Bearer ' + access_token};

                    let options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: {'Authorization': 'Bearer ' + access_token},
                        json: true
                    };

                    // use the access token to access the Spotify Web API
                    request.get(options, function (error, response, body) {
                        console.log(body);
                        res.send(body);
                    });

                } else {
                    res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_token'
                        }));
                }
            });
        }
    });

    app.get('/refresh_token', function (req, res) {

        // requesting access token from refresh token
        refresh_token = req.query.refresh_token;
        let authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                access_token = body.access_token;
                res.send({
                    'access_token': access_token
                });
            }
        });
    });

}