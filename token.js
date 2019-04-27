var config = require('config');
var bodyPaeser = require('body-parser');
var https = require('https');

var database = require('./database');

async function getToken(callback) {
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

		postData = require('querystring').stringify(queryParamConfig);
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
						console.log("end");
						var resultObject = JSON.parse(body);
						saveToken(resultObject.access_token);
					});
			} else {
				throw new Error("not 200");
			}
		}).on("error", (err) => {
			console.log("Error: " + err.message);
			throw new Error(err);
		});
		req.write(postData);
		req.end();
	});
}





exports.refreshToken = refreshToken;
exports.getToken = getToken;

