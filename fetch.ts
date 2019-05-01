import moment = require('moment');
import config = require('config');
import database = require('./database');
import MQ = require( './mq');

var cmdPublisher = new MQ.CmdPublisher();
cmdPublisher.init(config.get('cmdQueueHost'));

var fetchedListener = new MQ.FetchedListener();
fetchedListener.init(config.get('cmdQueueHost'),config.get('shopName'));

async function getRackIDfromRackSN(rackSN){
    var rackResult: any;
	rackResult = await database.select("select `ID` from `RackInstance` where `SN`=?",[rackSN]);

	if(rackResult.length == 0){
		throw new Error("cannot find the rack: " + rackSN);
	}
	
	return rackResult[0].ID;
}

async function findProductRack(shopName,productSN){
    var result : any;
	result = await database.select("select * from Shop sh left JOIN RackInstance r on r.ShopID=sh.ID \
    where sh.`Name` = '?' and ProductSN = '?' and ProductCount > 0",[shopName,productSN]);

	if(result.length ==0){
		throw new Error("cannot find product rack, shop:" + shopName + ", productSN:" + productSN);
    }

    var racks = [];
    for(var i=0;i<result.length;++i){
        var rack = new database.RackInstance();
        rack.shop = shopName;
        rack.rack = result[i].SN;
        rack.channel = result[i].Channel;
        rack.scanner = result[i].scanner;
        rack.indicator = result[i].indicator;
        rack.productSN = result[i].ProductSN;
        rack.productCount = result[i].productCount;
        racks.push(rack);
    }
	
	return racks;
}

async function fetchItem(code,tid,rackSN, unfetchedItem: database.POItem){
    var shopName = config.get('shopName');

    var racks = await findProductRack(shopName,unfetchedItem.productSN);
    for(var i=0; i< racks.length; ++i){
        cmdPublisher.publish(racks[i]);
    }
}

export async function fetchPO(rackSN,code) {

	//TODO: only tid is not going to be working
    var po = await database.getPOBy("code",code);
    
	var fetched = await database.getFetchedBy('code',code);

	var unfetched = 
		calcUnfetchedItems(po,fetched);
	
	for(var i=0;i<unfetched.items.length;++i){
        if(unfetched.items[i].productCount > 0){
            fetchItem(po.code, po.tid, rackSN,unfetched.items[i]);
        }
    }
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

