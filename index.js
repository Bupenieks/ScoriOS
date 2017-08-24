'use strict';

const http = require('http'),
      express = require('express'),
      cheerio = require('cheerio'),
      path = require('path'),
      request = require('request'),
    { URL } = require('url');

const app = express(),
      server = http.Server(app);

const IMDBUrl = 'http://www.imdb.com'

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

server.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'));
});

const locateMoviePage = searchUrl => {
  return new Promise((resolve, reject) => {
    request(searchUrl.toString(), (err, result, html) => {
      if (err) {
        console.error(err);
        reject('Invalid movie name');
      } else {
        let $ = cheerio.load(html);
        let firstResult = $('div .article > .findSection > .findList > tbody')
          .children()
          .first();
        let resultUrlSuffix = firstResult
          .children('.result_text')
          .children('a')
          .attr('href');

        let movieUrl = new URL(IMDBUrl + resultUrlSuffix);
        movieUrl.search = '';
        console.log(movieUrl)
        resolve(movieUrl);
      }
    });
  });
};

const retrieveMovieData = movieUrl => {
  return new Promise((resolve, reject) => {
    console.log(movieUrl.toString())
    request(movieUrl.toString() + 'fullcredits', (err, res, html) => {
      if (err) {
        reject('Could not find movie');
      } else {
        let $ = cheerio.load(html);
        let headerList = $('#fullcredits_content.header').children('.dataHeaderWithBorder');
        console.log(headerList.length)
        let composerHeader;
        for (let i = 0; i < headerList.length; i++) {
          console.log(headerList.html().toString())
          if (headerList.html().includes("Music")) {
              composerHeader = headerList;
              break;
          }
          headerList = headerList.next()
        };

          if (!composerHeader) {
            reject("Could not locate composer");
            return;
          }

          let name = composerHeader.next().find('tbody > tr > td > a').val();

        resolve(name);
      }
    });
  });
};

app.get('/request/', (req, res) => {
  let movieUrl = new URL(IMDBUrl + '/find?q=' + req.query.movie + '&s=tt&ttype=ft&ref_=fn_ft');

  locateMoviePage(movieUrl)
    .then(retrieveMovieData)
    .then(result => res.send(result))
    .catch(msg => res.status(400).send(msg));
});

app.use((req, res) => {
  res.status(404).send({ url: req.url });
});
