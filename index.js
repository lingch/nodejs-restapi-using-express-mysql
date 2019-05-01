var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var myshop = require('./myshop');
var token = require('./token');
var yzProxy = require('./youzanClient');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

app.use('/token',token.router);
app.use('/shop',myshop.router);
app.use('/yzProxy',yzProxy.router);

//create app server
var server = app.listen(18081, "0.0.0.0", function() {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});



