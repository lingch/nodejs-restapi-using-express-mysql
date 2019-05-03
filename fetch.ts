import moment = require('moment');
import config = require('config');
import database = require('./database');
import MQ = require( './mq');
import request = require('request');
import amqp = require('amqplib/callback_api');
import { RackInstance } from './database';
import { FetchedListener } from './myshop';

var rackConfig = require('./config/rackConfig.json');

export class CmdPublisher extends MQ.Publisher{
    async init(host){
        await super.init(host,'cmd');
    }

    async publishCmd(rack,msg: Cmd){
        this.channel.publish(this.ex, rack, new amqp.Buffer(msg))
    }
}

var cmdPublisher = new CmdPublisher();
cmdPublisher.init(config.get('cmdQueueHost'));

var upstream = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
function callUpstream(){
    return new Promise<database.PO>((resolve,reject) =>{
        request(upstream, { 
            json: true ,
            data: ''
        }, (err, res, body) => {
            if (err) { 
                reject(err);
            }else{
                var po: database.PO = body;
                resolve(po);
            }
          });
    });
}

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

    var racks: database.RackInstance[];
    for(var i=0;i<result.length;++i){
        var rack = new database.RackInstance();
        rack.shop = shopName;
        rack.rack = result[i].SN;
        rack.set = result[i].set;
        rack.channel = result[i].Channel;
        rack.productSN = result[i].ProductSN;
        rack.productCount = result[i].productCount;
        racks.push(rack);
    }
	
	return racks;
}

export class Cmd{
    push: {
            sn: string;
            set: number;
            channel: string;
            count: number;
        };

    indicators:{
        R: number;
        G: number;
        Y: number;
    }

    constructor(sn,set,channel,count,R,G,Y){
        if(sn){
            this.push.sn = sn;
            this.push.set = set;
            this.push.channel = channel;
            this.push.count = count;
        }else{
            this.push = null;
        }

        this.indicators.R = R;
        this.indicators.G = G;
        this.indicators.Y = Y;
    }
}

async function checkSetArr(set:number, setArr: Array<number>){
    for(var i=0;i<setArr.length;++i){
        if(set == setArr[i]){
            return true;
        }
    };

    return false;
}

async function fetchItem(code,tid,rack, set: Array<number>, unfetchedItem: database.POItem){
    var shopName = config.get('shopName');

    var rackInstances:RackInstance[] = await findProductRack(shopName,unfetchedItem.productSN);

    for(var i=0; i< rackInstances.length; ++i){
        var rackInst: RackInstance = rackInstances[i];

        if((rackInst.rack == rack) && (checkSetArr(rackInst.set,set))){
            //the correct set, green light and open the door
            cmdPublisher.publishCmd(rack,
                new Cmd(rackInst.productSN,rackInst.set,rackInst.channel,rackInst.productCount,0,1,0));
            database.saveFetchedItem(code,tid,new database.FetchedItem(rack,new database.POItem(rackInst.productSN,rackInst.productCount)),true);
        }else{
            //not the correct set, yellow light to mind the client
            cmdPublisher.publishCmd(rack,
                new Cmd(null,null,null,null,0,0,1));
        }
    }
}

async function getPOBy(field,value){
    var po: database.PO = await database.getPOBy(field,value);
	if(po == null){
        //not found in db, call upstream
        po = await callUpstream();
        if(po ==null){
            throw new Error("unable to get order info");
        }
        await database.savePO(po);
    }

    return po;
}

export async function fetchPO(rackSN,set: Array<number> ,code) {

	//TODO: only tid is not going to be working
    var po = await getPOBy("code",code);
    
	var fetched = await database.getFetchedBy('code',code);

	var unfetched = 
		calcUnfetchedItems(po,fetched);
	
	for(var i=0;i<unfetched.items.length;++i){
        if(unfetched.items[i].productCount > 0){
            fetchItem(po.code, po.tid, rackSN,set,unfetched.items[i]);
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

