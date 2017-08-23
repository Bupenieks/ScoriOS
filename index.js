'use strict';

const http = require('http'),
      express = require('express'),
      cheerio = require('cheerio'),
      path = require('path'),
      request = require('request');

const app = express(),
      server = http.Server(app);

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

server.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'));
});

const locateMoviePage = searchUrl => {
  return new Promise((resolve, reject) => {
    request(searchUrl, (err, result, html) => {
      if (err) {
        reject('Invalid movie name');
      } else {
        let $ = cheerio.load(html);
        let firstResult = $('div .article > .findSection > .findList > tbody')
          .children()
          .first();
        let resultUrl = firstResult
          .children('.result_text')
          .children('a')
          .attr('href');

        resolve(resultUrl);
      }
    });
  });
};

const retrieveMovieData = movieUrl => {
  return new Promise((resolve, reject) => {
    request(movieUrl, (err, res, html) => {
      if (err) {
        reject('Could not find movie');
      } else {
        let $ = cheerio.load(html);

        let resultUrl = ''; //TODO

        resolve(resultUrl);
      }
    });
  });
};

app.get('/request/', (req, res) => {
  const urlPrefix = 'http://www.imdb.com/find?q=',
        urlSuffix = '&s=tt&ttype=ft&ref_=fn_ft';

  let movie = req.query.movie;

  locateMoviePage(urlPrefix + movie + urlSuffix)
    .then(retrieveMovieData)
    .catch(msg => {
      res.status(400).send(msg);
    });
});

app.use((req, res) => {
  res.status(404).send({ url: req.url });
});
