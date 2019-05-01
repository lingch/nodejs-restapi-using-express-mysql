import moment = require('moment');

import database = require('./database');

async function getRackIDfromRackSN(rackSN){
    var rackResult: any;
	rackResult = await database.select("select `ID` from `RackInstance` where `SN`=?",[rackSN]);

	if(rackResult.length == 0){
		throw new Error("cannot find the rack: " + rackSN);
	}
	
	return rackResult[0].ID;
}

async function findProductChannel(rackSN,productSN){
    var result : any;
	result = await database.select("select * from `RackInstance` where `SN`=? and `ProductSN`=? and `ProductCount`>0",[rackSN,productSN]);

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

async function fetchItem(code,tid,rackSN, unfetchedItem: database.POItem){
	var channel = await findProductChannel(rackSN,unfetchedItem.productSN);
	var item = buildCmdItem(unfetchedItem.productSN,
			channel,
			unfetchedItem.productCount);
	await saveFetchedOrder(code,tid,rackSN,unfetchedItem);
	return item;
}

async function fetchPO(rackSN,code) {

	//TODO: only tid is not going to be working
    var po = await database.getPOBy("code",code);
    
	var fetched = await database.getFetchedBy('code',code);

	var unfetched = 
		calcUnfetchedItems(po,fetched);
	
	var fetchCmd = {
		"code": code,
		"items": []
	}

	for(var i=0;i<unfetched.items.length;++i){
        if(unfetched.items[i].productCount > 0)
		fetchItem(po.code, po.tid, rackSN,unfetched.items[i]);
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


function minusFetched(item: database.POItem, fetched: database.PO): database.POItem{
	for(var i=0; i< fetched.items.length; ++i){
		if(item.productSN == fetched.items[i].productSN ){
            item.productCount -= fetched.items[i].productCount;
            return item;
		}
	}
}

function calcUnfetchedItems(po: database.PO,fetched: database.PO): database.PO{
	for(var i=0; i< po.items.length;++i){
		po.items[i] = minusFetched(po.items[i],fetched);
	}
	return po;
}


exports.getFetchedOrderByTid = getFetchedOrderByTid;
exports.getFetchedOrderByCode = getFetchedOrderByCode;
exports.findProductChannel = findProductChannel;
exports.saveFetchedOrder = saveFetchedOrder;
exports.saveFetchedOrders = saveFetchedOrders;
exports.getPOByCode = getPOByCode;
exports.savePO = savePO;
exports.getRackIDfromRackSN = getRackIDfromRackSN;

