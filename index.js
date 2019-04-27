var http = require("http");
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var youzan = require('./youzanClient');
var bluebird = require('bluebird');

var database = require('./database');

//start mysql connection
var connection = mysql.createConnection({
  host: 'localhost', //mysql database host name
  user: 'root', //mysql database user name
  password: '', //mysql database password
  database: 'test' //mysql database name
});

// connection.connect(function(err) {
//   if (err) throw err
//   console.log('You are now connected with mysql database...')
// })
//end mysql connection

//start body-parser configuration
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));
//end body-parser configuration

//create app server
var server = app.listen(18081, "0.0.0.0", function() {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});

app.get('/PO/byCode/:code', function(req, res) {

  youzan.getOrderByCode(req.param.code);

  res.json({
    "code": req.params.code,
    "items": [{
      "sn": "1234567-1",
      "channel": 12,
      "count": 1
    }, {
      "sn": "8838833-2",
      "channel": 31,
      "count": 2
    }]
  }).end();
});

app.get('/fetch/byCode/:code',(req,res)=>{
  youzan.fetchByCodeAsync(req.headers['x-clientdn'],
    req.params.code)
    .then((fetchCmd)=>{
      res.status(200).send(fetchCmd);
    }).catch((err)=>{
      res.status(500).send(err);
  });
});

app.get('/token/refresh', function(req, res) {
  require("./token").refreshToken(function() {
    res.status(200).send({
      "status": "ok"
    });
  })
});

app.get('/token/0', function(req, res) {
  require("./token").getToken(function(token) {
    res.status(200).send({
      "token": token
    });
  })
});

app.post('/events/scanner',(req,res)=>{
  try{
    var client = req.headers['x-clientdn'];
    var code = req.params[''];

    //TODO:check the code type to see if we can process it
  
    var cmd = fetchByCode(client,code);
    res.status(200).send(cmd);
  }catch(Error){
    res.status(501).send();
  }

})