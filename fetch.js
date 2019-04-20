var moment = require('moment');

var database = require('./database');

function getFetchedOrder(tid,callback) {
	database.select("select * from `FetchRecord` where `tid`=?", [tid],callback);
}

function getRackIDfromRackSN(rackSN,callback){
	database.select("select `ID` from `RackInstance` where `SN`=?",[rackSN],function(rackResult){
		if(rackResult.length == 0){
			throw "cannot find the rack";
		}

		callback(rackResult[0].ID);
	});
}

function findProductChannel(rackSN,productSN,callback){
	database.select("select * from `RackInstance` where `SN`=? and `productSN`=? and `productCount`>0",[rackSN,productSN],function(result){
		if(result.length ==0)
			throw "channel not found";
		callback(result[0].Channel);
	});
}

function saveFetchedOrder(code,tid,rackSN,order,callback){
	var now = moment().format('YYYY-MM-DD HH:mm:ss');

	getRackIDfromRackSN(rackSN,rackID=>{

	database.update(
		"insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
		[code,tid,order.outer_item_id,order.num,rackID,now],()=>{
			database.update("update `RackInstance` set `productCount`=`productCount`-? where `ID`=?",
			[order.num,rackID],()=>{
				callback();
			})
		}
	);

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
exports.findProductChannel = findProductChannel;
exports.saveFetchedOrder = saveFetchedOrder;
exports.saveFetchedOrders = saveFetchedOrders;
