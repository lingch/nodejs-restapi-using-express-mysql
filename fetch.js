var moment = require('moment');

var database = require('./database');

function getFetchedOrder(tid,callback) {
	database.select("select * from `fetchRecord` where `tid`=?", [tid],callback);
}

function getRackIDfromRackSN(rackSN,callback){
	database.select("select `ID` from `rackInstance` where `SN`=?",[rackSN],function(rackResult){
		if(rackResult.length == 0){
			throw "cannot find the rack";
		}

		callback(reckReslut[0].ID);
	});
}

function findProductChannel(rackSN,productSN,callback){
	database.select("select * from rackInstance where SN=? and productSN=? and productCount>0",[rackSN,productSN],function(result){
		if(result.length ==0)
			throw "channel not found";
		callback(result[0].channel);
	});
}

function saveFetchedOrder(rackSN,code,tid,order,callback){
	var now = moment().format('yyyy-MM-dd hh:mm:ss');

	getRackIDfromRackSN(rackSN,rackID=>{

	database.update(
		"insert into `fetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
		[code,tid,order.outer_item_id,order.num,rackID,now],()=>{
			database.update("update rackInstance set productCount=? where ID=?",
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
				saveFetchedOrder(rackSN,code,tid,order,callback)
			}
		);
}

exports.getFetchedOrder = getFetchedOrder;
exports.findProductChannel = findProductChannel;
exports.saveFetchedOrder = saveFetchedOrder;
exports.saveFetchedOrders = saveFetchedOrders;
