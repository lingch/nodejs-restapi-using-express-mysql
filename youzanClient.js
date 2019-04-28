const express = require('express')
const router = express.Router()

var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');

var FanoutQueue = require('./mq').FanOutQueue;

var poPublishQueue = await new FanoutQueue('mywxstore.cn','amq.fanout',true);

async function yzInvoke(api, params) {

	return new Promise((resolve,reject) =>{
		var token = await require("./token").getToken(); 

		var myClient = new YZClient(new Token(mytoken));
	
		var promise = myClient.invoke(api, '3.0.0', 'GET', params, undefined);
	
		promise.then(function(resp) {
			//console.log('resp: ' + resp.body);
			if(resp.statusCode == 200){
				var body = JSON.parse(resp.body);
	
				if(body.response){
					resolve(body.response);
				}else if(body.error_response){
					reject(body.error_response);
				}else{
					reject("call YZ failed, unrecognized response");
				}
			}else{
				reject("call YZ failed, code:" + resp.statusCode + ", msg:" + resp.statusMessage);
			}
		}, function(err) {
			console.log('err: ' + err);
			reject(err)
		}, function(prog) {
			console.log('prog: ' + prog);
			reject(prog);
		});
	});
}

async function yzGetPOByTid(tid) {
	params = {};
	params['tid'] = tid;
	var tidData = await yzInvoke('youzan.trade.get',params);
	var pos = yzTradeDataToPO(code,tidData.trade);
	return pos;
}

function yzTradeDataToPO(code,trade){
	var pos=[];
	for(i=0;i<trade.orders.length;++i){
		var po = {"code": code,
			"tid": trade.tid,
			"productSN":trade.orders[i].outer_item_id,
			"productCount": trade.orders[i].num
		};
		pos.push(po);
	}

	return pos;
}

async function yzGetPOByCode(code){

	var codeData = await yzInvoke('youzan.trade.selffetchcode.get', params);

	return await yzGetPOByTid(codeData.tid);
}

router.post('/msgPush', (req,res) => {
  
	poPublishQueue.sendMsg(PO);
  
	res.status(200),send('success');
  });

router.get('/PO/byCode/:code',(req,res) =>{
    var code = req.param.code;

	var pos = await yzGetPOByCode(code);
    res.status(200).send(pos);
});

router.get('/PO/byTid/:tid',(req,res) =>{
    var tid = req.param.tid;

	var pos = await yzGetPOByTid(tid);
    res.status(200).send(pos);
});

// fetchByCode("/C=cn/ST=gd/O=zg/CN=androidtest","80392436389",function (fetchCmd){
// 	console.log(data);
// });


exports.router = router;

