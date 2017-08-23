var http = require('http'),
    express = require('express'),
    path = require('path')

var app = express(),
    server = http.Server(app)
app.set('port', process.env.PORT || 3000)

server.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'))
})

app.use(express.static('public'))

app.get('/request/', function (req, res) {
    res.send("hello");
});

app.use((req,res) => {
    res.render('404', {url:req.url})
});

