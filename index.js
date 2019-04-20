var http = require("http");
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var youzan = require('./youzanClient');

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

//rest api to get all customers
app.get('/customer', function(req, res) {
  connection.query('select * from customer', function(error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});
//rest api to get a single customer data
app.get('/customer/:id', function(req, res) {
  connection.query('select * from customers where Id=?', [req.params.id], function(error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});

//rest api to create a new customer record into mysql database
app.post('/customer', function(req, res) {
  var params = req.body;
  console.log(params);
  connection.query('INSERT INTO customer SET ?', params, function(error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});

//rest api to update record into mysql database
app.put('/customer', function(req, res) {
  connection.query('UPDATE `customer` SET `Name`=?,`Address`=?,`Country`=?,`Phone`=? where `Id`=?', [req.body.Name, req.body.Address, req.body.Country, req.body.Phone, req.body.Id], function(error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});

//rest api to delete record from mysql database
app.delete('/customer', function(req, res) {
  console.log(req.body);
  connection.query('DELETE FROM `customer` WHERE `Id`=?', [req.body.Id], function(error, results, fields) {
    if (error) throw error;
    res.end('Record has been deleted!');
  });
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
  require('./youzanClient').fetchByCode(
    req.headers['x-clientdn'],
    req.params.code,(err,fetchCmd)=>{
      if(err){
        res.status(500).send(err);
      }else{
        res.status(200).send(fetchCmd);
      }
  })
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
