var config = require('config');
var bodyPaeser = require('body-parser');
var https = require('https');

var database = require('./database');

function getToken(callback) {
	database.select("select `key`,`value` from config where `key`=?", ['token'], function(result) {
		console.log(result);
		callback(result[0].value);
	});
}

function saveToken(token) {
	database.update("update `config` set `value`=? where `key`=?", [token, 'token']);
}

function refreshToken(callback) {
	var tokenConfig = config.get('token');
	var queryParamConfig = tokenConfig.queryParam;

	postData = require('querystring').stringify(queryParamConfig);
	postData = postData + "&grant_type=silent"

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

	var req = https.request(opt, function(serverFeedback) {

		if (serverFeedback.statusCode == 200) {
			var body = "";
			serverFeedback.on('data', function(data) {
					body += data;
				})
				.on('end', function() {
					console.log("end");
					var resultObject = JSON.parse(body);
					saveToken(resultObject.access_token);
					callback();
				});
		} else {
			throw "not 200";
		}
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
	req.write(postData);
	req.end();
}



exports.refreshToken = refreshToken;
exports.getToken = getToken;

