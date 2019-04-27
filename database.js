var config = require('config');

var mysql = require('mysql');

dbConfig = config.get('database');

var connection = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database
});

async function select(cmd,params) {
	return new Promise((resolve,reject) =>{
		connection.query(cmd, params, function(error, results, fields) {
			if (error) {
				reject(error);
			}else{
				resolve(results);
			}
		});
	});
}

async function update(cmd, params,callback ){
	return new Promise((resolve,reject)=>{
	connection.query(cmd, params, function(error, results, fields) {
		if (error) {
			reject(error);
		}else{
			resolve(undefined);
		}
	});
});
}

exports.select=select;
exports.update=update;

