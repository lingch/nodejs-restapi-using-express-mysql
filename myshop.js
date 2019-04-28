const express = require('express')
const router = express.Router()
const request = require('request');

var upstream = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
async function callUpstream(){
    return new Promise((resolve,reject) =>{
        request(upstream, { 
            json: true ,
            data: ''
        }, (err, res, body) => {
            if (err) { 
                reject(err);
            }else{
                resolve(body);
            }
          });
    });
}

var MQ = require('./mq');

var poQ = new MQ.QueueRecv('amq.fanout',true,onPO);
var fetchQ = new MQ.QueueRecv('amq.fanout',true,onFetch);

function onPO(msg){
    var PO = { "items" : [] };
	req.body.full_order_info.orders.forEach((value) =>{
	  var item = {};
	  item.tid = req.body.order_info.tid;
	  item.sn = value.outer_item_id;
	  item.title = value.title;
  
	  PO.items.push(item);
  
	  database.update('insert into PO(tid,sn,title) values(?,?,?)',[item.tid,item.sn,item.title]);
    });
    
    //TODO: ack msg
}

function onFetch(msg){
    if(msg.sender != 'myself'){
        saveFetchedOrder(msg.code,msg.tid,msg.rackSN,msg.unfetchedOrder);
        //TODO: ack msg
    }
}



async function localGetPOBy(field,value){
	var result = await database.select("select * from `PO` where `"+field+"`=?",[value]);
	return result;
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

async function getPOBy(field,value){
	var result = await localGetPOBy(field,value);
	if(result.length == 0){
        //not found in db, call upstream
        var po = await callUpstream();
        savePOs(po);
        return po;
    }
}

router.get('/PO/byCode/:code',(req,res) =>{
    var code = req.param.code;

	getPOBy("code",code).then((po) =>{
        res.status(200).send(po);
    });
});

router.get('/PO/byTid/:tid',(req,res) =>{
    var tid = req.param.tid;

	getPOBy("tid",tid).then((po) =>{
        res.status(200).send(po);
    });
});


router.post('/events/scanner',(req,res)=>{
    try{
      var client = req.headers['x-clientdn'];
      var code = req.params[''];
  
      //TODO:check the code type to see if we can process it

      var pos = await getPOBy("code",code);
    
      fetch.fetchByCode(pos,client,code);
      res.status(200).send();
    }catch(Error){
      res.status(501).send();
    }
  });
  
  exports.router = router;

