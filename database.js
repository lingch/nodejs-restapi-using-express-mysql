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

/////////////////////////////////////////////
exports.savePOItem = async function (code,tid,productSN,productCount,now){
	await database.update("insert into `PO`(`code`,`tid`,`productSN`,`productCount`,`updatetime`) \
		values(?,?,?,?,?)",[code,tid,productSN,productCount,now]);
}

async function savePO(PO){
	return new Promise((resolve,reject) =>{
		var now = moment().format('YYYY-MM-DD HH:mm:ss');

		//got, save to database
		var savePs = [];
		PO.forEach((item)=>{
			savePs.push(savePOItem(PO.code,PO.tid,item.productSN,item.productCount,now));
		});
		Promise.all(savePs).then(()=>{
			resolve();
		});
	});
}
////////////////////////////////////////////
async function saveFetchItem(code,tid,fetchitem){
	await database.update(
		"insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
		[code,tid,fetchitem.productSN,fetchitem.productCount,fetchitem.rackID,fetchitem.fetchTime]);
}
async function saveFetch(fetchInfo){
	fetchInfo.forEach(
		(fetchItem)=>{
			saveFetchItem(fetchInfo.code,fetchInfo.tid,fetchItem)
		}
	);
}

/////////////////////////////////////////////
exports.getFetchedOrderByTid = async function (tid) {
	var fetchedOrders = await database.select("select * from `FetchRecord` where `tid`=?", [tid]);
	return fetchedOrders;
}

exports.getFetchedOrderByCode = async function (code) {
	var fetchedOrders = database.select("select * from `FetchRecord` where `code`=?", [code]);
	return fetchedOrders;
}


exports.localGetPOBy = async function (field,value){
	var result = await database.select("select * from `PO` where `"+field+"`=?",[value]);
	return result;
}

