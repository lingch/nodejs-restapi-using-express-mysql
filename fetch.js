var moment = require('moment');

var database = require('./database');

function getFetchedOrder(tid,callback) {
	database.select("select * from `FetchRecord` where `tid`=?", [tid],callback);
}

function getRackIDfromRackSN(rackSN,callback){
	database.selectAsync("select `ID` from `RackInstance` where `SN`=?",[rackSN])
	.then((rackResult) => {
		if(rackResult.length == 0){
			callback("cannot find the rack: " + rackSN);
		}else{
			callback(undefined,rackResult[0].ID);
		}
	},(err)=>{
		callback(err);
	});
}

function findProductChannel(rackSN,productSN,callback){
	database.select("select * from `RackInstance` where `SN`=? and `productSN`=? and `productCount`>0",[rackSN,productSN])
	.then((result)=>{
		if(result.length ==0){
			callback("channel not found, rackSN:" + rackSN + ", productSN:" + productSN);
		}else{
			callback(undefined,result[0].Channel);
		}
	},(err)=>{
		callback(err);
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
