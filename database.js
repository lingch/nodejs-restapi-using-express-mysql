var config = require('config');

var mysql = require('mysql');

dbConfig = config.get('database');

var connection = mysql.createConnection({
	host: dbConfig.host,
	user: dbConfig.user,
	password: dbConfig.password,
	database: dbConfig.database
});

exports.select=async function (cmd,params) {
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

exports.update=async function (cmd, params ){
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

exports.getFetchedOrderByTid = async function (tid) {
	var fetchedOrders = await database.select("select * from `FetchRecord` where `tid`=?", [tid]);
	return fetchedOrders;
}


exports.savePO = async function (code,tid,productSN,productCount){
	var now = moment().format('YYYY-MM-DD HH:mm:ss');

	await database.update("insert into `PO`(`code`,`tid`,`productSN`,`productCount`,`updatetime`) \
		values(?,?,?,?,?)",[code,tid,productSN,productCount,now]);
}

exports.getFetchedOrderByCode = async function (code) {
	var fetchedOrders = database.select("select * from `FetchRecord` where `code`=?", [code]);
	return fetchedOrders;
}

async function savePOs(pos){
	return new Promise((resolve,reject) =>{
		//got, save to database
		var savePs = [];
		pos.forEach((po)=>{
			savePs.push(fetch.savePO(code,codeData.tid,po.productSN,po.productCount));
		});
		Promise.all(savePs).then(()=>{
			resolve();
		});
	});
}
async function localGetPOBy(field,value){
	var result = await database.select("select * from `PO` where `"+field+"`=?",[value]);
	return result;
}

