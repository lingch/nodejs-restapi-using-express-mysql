const express = require('express')
const router = express.Router()

var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');

var fetch = require('./fetch');



async function getOrderByTid(tid,callback) {
	return new Promise((resolve,reject) => {
		params = {};
		params['tid'] = tid;
		this.callYZ('youzan.trade.get',params)
		.then((data)=>{
			resolve(data);
		});
	});
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

async function getPOByCode(code){

	//get from yz
	var codeData = await callYZ('youzan.trade.selffetchcode.get', params);
	var tidData = await getOrderByTid(codeData.tid);
	var pos = yzTradeDataToPO(code,tidData.trade)

	//got, save to database
	var savePs = [];
	pos.forEach((po)=>{
		savePs.push(fetch.savePO(code,codeData.tid,po.productSN,po.productCount));
	});
	bluebird.all(savePs).then(()=>{
		callback(null,pos);
	});
}



async function callYZ(api, params,callback) {

	require("./token").getToken(function(mytoken) {

		var myClient = new YZClient(new Token(mytoken));

		var promise = myClient.invoke(api, '3.0.0', 'GET', params, undefined);

		promise.then(function(resp) {
			//console.log('resp: ' + resp.body);
			if(resp.statusCode == 200){
				var body = JSON.parse(resp.body);

				if(body.response){
					callback(undefined,body.response);
				}else if(body.error_response){
					callback(body.error_response);
				}else{
					callback("call YZ failed, unrecognized response");
				}
			}else{
				callback("call YZ failed, code:" + resp.statusCode + ", msg:" + resp.statusMessage);
			}
		}, function(err) {
			console.log('err: ' + err);
			callback(err)
		}, function(prog) {
			console.log('prog: ' + prog);
			callback(prog);
		});
	});
}

// fetchByCode("/C=cn/ST=gd/O=zg/CN=androidtest","80392436389",function (fetchCmd){
// 	console.log(data);
// });

exports.fetchByCode = fetchByCode;
exports.getPOByCode = getPOByCode;
exports.callYZ = callYZ;
exports.getOrderByTid = getOrderByTid;
exports.yzTradeDataToPO = yzTradeDataToPO;
exports.fetchOrder = fetchOrder;
exports.router = router;