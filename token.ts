var config = require('config');
var https = require('https');
var express = require('express');
var database = require('./database');
const router = express.Router();

async function getToken() {
	var result = database.select("select `key`,`value` from config where `key`=?", ['token'])

	console.log(result);
	return result[0].value;
}

async function saveToken(token) {
	database.update("update `config` set `value`=? where `key`=?", [token, 'token']);
}

async function refreshToken() {
	return new Promise((resolve,reject) =>{
		var tokenConfig = config.get('token');
		var queryParamConfig = tokenConfig.queryParam;

		var postData = require('querystring').stringify(queryParamConfig);
		postData = postData + "&grant_type=silent";

		console.log(postData);

		var opt = {
			method: "POST",
			host: tokenConfig.host,
			port: tokenConfig.port,
			path: tokenConfig.path,
			headers: {
				"Content-Type": 'application/x-www-form-urlencoded',
				"Content-Length": postData.length
			}
		};

		console.log(opt);

		var req = https.request(opt, (serverFeedback) => {

			if (serverFeedback.statusCode == 200) {
				var body = "";
				serverFeedback.on('data', (data) => {
						body += data;
					})
					.on('end', () => {
						var resultObject = JSON.parse(body);
						saveToken(resultObject.access_token);
						resolve();
					});
			} else {
				reject("not 200");
			}
		}).on("error", (err) => {
			reject(err);
		});
		req.write(postData);
		req.end();
	});
}


//curl -X GET http://127.0.0.1:18081/token/refresh
router.get('/refresh', function(req, res) {
	refreshToken().then(()=> {
	  res.status(200).send({
		"status": "ok"
	  });
	})
  });
  
  router.get('/', function(req, res) {
	getToken().then((token) => {
	  res.status(200).send({
		"token": token
	  });
	})
  });
  
exports.router = router;

