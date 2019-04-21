var moment = require('moment');

var database = require('./database');

function getFetchedOrder(tid,callback) {
	database.select("select * from `FetchRecord` where `tid`=?", [tid],callback);
}

function getFetchedOrderByCode(code,callback) {
	database.select("select * from `FetchRecord` where `code`=?", [code],callback);
}

function getRackIDfromRackSN(rackSN,callback){
	database.selectAsync("select `ID` from `RackInstance` where `SN`=?",[rackSN])
	.then((rackResult) => {
		if(rackResult.length == 0){
			callback("cannot find the rack: " + rackSN);
		}else{
			callback(undefined,rackResult[0].ID);
		}
	});
}

function findProductChannel(rackSN,productSN,callback){
	database.selectAsync("select * from `RackInstance` where `SN`=? and `ProductSN`=? and `ProductCount`>0",[rackSN,productSN])
	.then((result)=>{
		if(result.length ==0){
			callback("channel not found, rackSN:" + rackSN + ", productSN:" + productSN);
		}else{
			callback(undefined,result[0].Channel);
		}
	});
}

function saveFetchedOrder(code,tid,rackSN,order,callback){
	var now = moment().format('YYYY-MM-DD HH:mm:ss');

	this.getRackIDfromRackSNAsync(rackSN).then(rackID=>{

	database.updateAsync(
		"insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
		[code,tid,order.productSN,order.productCount,rackID,now]).then(()=>{
			return database.updateAsync("update `RackInstance` set `productCount`=`productCount`-? where `ID`=?",
			[order.productCount,rackID])
		}).then(()=>{
			callback(null);
		});
		
	});
}

function savePO(code,tid,productSN,productCount,callback){
	var now = moment().format('YYYY-MM-DD HH:mm:ss');

	database.updateAsync("insert into `PO`(`code`,`tid`,`productSN`,`productCount`,`updatetime`) \
		values(?,?,?,?,?)",[code,tid,productSN,productCount,now])
	.then(()=>{
		callback(null);
	});
}

function getPOByCode(code,callback){
	database.selectAsync("select * from `PO` where `code`=?",[code])
	.then((result) =>{
		callback(null,result);
	});
}

function saveFetchedOrders(rackSN,code,tid,orders,callback){
		orders.forEach(
			(order)=>{
				saveFetchedOrder(code,tid,rackSN,order,callback)
			}
		);
}

exports.getFetchedOrder = getFetchedOrder;
exports.getFetchedOrderByCode = getFetchedOrderByCode;
exports.findProductChannel = findProductChannel;
exports.saveFetchedOrder = saveFetchedOrder;
exports.saveFetchedOrders = saveFetchedOrders;
exports.getPOByCode = getPOByCode;
exports.savePO = savePO;
exports.getRackIDfromRackSN = getRackIDfromRackSN;

