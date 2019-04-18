var config = require('config');
var bodyPaeser = require('body-parser');
var https = require('https');

var mysql = require('mysql');


function refreshToken(req, res) {
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
					console.log(resultObject.access_token);
					res.status(200).send("ok");
				});
		} else {
			res.status(500).send("error");
		}
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
	req.write(postData);
	req.end();
}


exports.refreshToken = refreshToken;