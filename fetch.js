var moment = require('moment');

var database = require('./database');


async function getRackIDfromRackSN(rackSN){
	var rackResult = await database.select("select `ID` from `RackInstance` where `SN`=?",[rackSN])

	if(rackResult.length == 0){
		throw new Error("cannot find the rack: " + rackSN);
	}
	
	return rackResult[0].ID;
}

async function findProductChannel(rackSN,productSN){
	var result = database.select("select * from `RackInstance` where `SN`=? and `ProductSN`=? and `ProductCount`>0",[rackSN,productSN]);

	if(result.length ==0){
		throw new Error("channel not found, rackSN:" + rackSN + ", productSN:" + productSN);
	}
	
	return result[0].Channel;
}


function buildCmdItem(sn,channel,count){
	var item = {};
	item.sn = sn;
	item.channel = channel;
	item.count = count;

	return item
}

async function fetchOrder(code,tid,rackSN, unfetchedOrder){
	var channel = await findProductChannel(rackSN,unfetchedOrder.productSN);
	var item = buildCmdItem(unfetchedOrder.productSN,
			channel,
			unfetchedOrder.productCount);
	await saveFetchedOrder(code,tid,rackSN,unfetchedOrder);
	return item;
}

async function fetchByCode(PO,rackSN,code) {

	//TODO: only tid is not going to be working
	
	var dbResult = await getFetchedOrderByCode(code)

	var unfetchedOrders = 
		calUnfetchedRecords(PO,dbResult);
	
	fetchCmd = {
		"code": code,
		"items": []
	}

	if(unfetchedOrders.length > 0){
		var fetches = [];
		unfetchedOrders.forEach((unfetchedOrder)=>{
			fetches.push(await fetchOrder(unfetchedOrder.code, unfetchedOrder.tid, rackSN,unfetchedOrder));
		});

		Promise.all(fetches)
		.then((items)=>{
			fetchCmd.items=items;
			return fetchCmd;
		});
	}else{
		return fetchCmd;
	}
}

async function saveFetchItem(code,tid,fetchitem){
	var now = moment().format('YYYY-MM-DD HH:mm:ss');

	var rackID = await this.getRackIDfromRackSN(rackSN);

	await database.update(
		"insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
		[code,tid,order.productSN,order.productCount,rackID,now]);

	await database.update("update `RackInstance` set `productCount`=`productCount`-? where `ID`=?",
			[order.productCount,rackID]);
}


function checkPoInFetchRecord(po,records){
	var exists = false;
	for(i=0; i< records.length; ++i){
		if(po.productSN == records[i].productSN){
			return true;
		}
	}

	//fetch record not found
	return false;
}

function calUnfetchedRecords(pos,dbResult){
	var retPos = [];
	for(var i=0; i< pos.length;++i){
		if(!checkPoInFetchRecord(pos[i],dbResult)){
			retPos.push(pos[i]);
		};
	}
	return retPos;
}


exports.getFetchedOrderByTid = getFetchedOrderByTid;
exports.getFetchedOrderByCode = getFetchedOrderByCode;
exports.findProductChannel = findProductChannel;
exports.saveFetchedOrder = saveFetchedOrder;
exports.saveFetchedOrders = saveFetchedOrders;
exports.getPOByCode = getPOByCode;
exports.savePO = savePO;
exports.getRackIDfromRackSN = getRackIDfromRackSN;

