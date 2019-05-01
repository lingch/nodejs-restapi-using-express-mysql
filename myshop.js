const express = require('express')
const router = express.Router()
const request = require('request');
var MQ = require('./mq');

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

// var poQ = new MQ.POListener();
// poQ.init('amq.fanout','',onPO);
// var fetchQ = new MQ.FetchedListener();
// fetchQ.init('amq.fanout','',onFetch);

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

async function getPOBy(field,value){
	var po = await database.getPOBy(field,value);
	if(po == null){
        //not found in db, call upstream
        po = await callUpstream();
        if(po ==null){
            throw new Error("unable to get order info");
        }
        await savePO(po);
    }

    return po;
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


router.post('/events/scanner/:code',(req,res)=>{
    try{
      var client = req.headers['x-clientdn'];
      var code = req.params['code'];
  
      //TODO:check the code type to see if we can process it

      fetch.fetchPO(client,code);
      res.status(200).send();
    }catch(Error){
      res.status(501).send();
    }
  });
  
  exports.router = router;

