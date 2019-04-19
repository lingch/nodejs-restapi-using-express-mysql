var config = require('config');

var mysql = require('mysql');

dbConfig = config.get('database');

var connection = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database
});

function select(cmd,params, callback) {
	connection.query(cmd, params, function(error, results, fields) {
		if (error) {
			console.log(error);
		}else{
			callback(results);
		}
	});
}

function update(cmd, params,callback ){
	connection.query(cmd, params, function(error, results, fields) {
		if (error) {
			console.log(error);
		}

		callback();
	});
}

exports.select=select;
exports.update=update;

