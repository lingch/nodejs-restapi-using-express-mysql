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
			callback(error);
		}else{
			callback(undefined,results);
		}
	});
}

function update(cmd, params,callback ){
	connection.query(cmd, params, function(error, results, fields) {
		if (error) {
			callback(error);
		}else{
			callback(undefined);
		}
	});
}

exports.select=select;
exports.update=update;

