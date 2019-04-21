var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');

var fetch = require('./fetch');

var bluebird = require('bluebird');

function getOrderByTid(tid,callback) {
	params = {};
	params['tid'] = tid;
	this.callYZAsync('youzan.trade.get',params)
	.then((data)=>{
		callback(null,data);
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

function buildCmdItem(sn,channel,count){
	var item = {};
	item.sn = sn;
	item.channel = channel;
	item.count = count;

	return item
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

function fetchOrder(code,tid,rackSN, unfetchedOrder,callback){
	fetch.findProductChannelAsync(rackSN,unfetchedOrder.productSN).then((channel)=>{
		item = buildCmdItem(unfetchedOrder.productSN,
			channel,
			unfetchedOrder.productCount);
		return fetch.saveFetchedOrderAsync(code,tid,rackSN,unfetchedOrder).then(()=>{
			callback(undefined,item);
		});
	});
}

function yzTradeDataToPO(code,trade, callback){
	var pos=[];
	for(i=0;i<trade.orders.length;++i){
		var po = {"code": code,
			"tid": trade.tid,
			"productSN":trade.orders[i].outer_item_id,
			"productCount": trade.orders[i].num
		};
		pos.push(po);
	}

	callback(null,pos);
}

function getPOByCode(code,callback){
	fetch.getPOByCodeAsync(code)
	.then((pos) =>{
		if(pos.length>0){
			//got from database
			callback(null,pos);
		}else{
			//get from yz
			this.callYZAsync('youzan.trade.selffetchcode.get', params)
			.then((codeData) => {
				this.getOrderByTidAsync(codeData.tid).then((tidData) => {
					this.yzTradeDataToPOAsync(code,tidData.trade)
					.then((pos)=>{
						//got, save to database
						var savePs = [];
						pos.forEach((po)=>{
							savePs.push(fetch.savePOAsync(code,codeData.tid,po.productSN,po.productCount));
						});
						bluebird.all(savePs).then(()=>{
							callback(null,pos);
						});
					});
				});
			});
		}
	})

	
}
// function f1(callback) { f22().catch((err)=>{
// 	console.log(err);
// }); }
// function f2(callback) { f33(); }
// function f3(callback) {
//   callback('no way!');
// }
// f11 = bluebird.promisify(f1);
// f22 = bluebird.promisify(f2);
// f33 = bluebird.promisify(f3);

function fetchByCode(rackSN,code,callback) {
	//f11();

	params = {};
	params['code'] = code;
	
	this.getPOByCodeAsync(code).then((pos)=>{
		fetch.getFetchedOrderByCodeAsync(code)
		.then((dbResult)=>{
			var unfetchedOrders = 
				calUnfetchedRecords(pos,dbResult);
			
			fetchCmd = {
				"code": code,
				"items": []
			}
	
			if(unfetchedOrders.length > 0){
				var fetches = [];
				unfetchedOrders.forEach((unfetchedOrder)=>{
					fetches.push(this.fetchOrderAsync(unfetchedOrder.code, unfetchedOrder.tid, rackSN,unfetchedOrder));
				});
	
				bluebird.all(fetches)
				.then((items)=>{
					fetchCmd.items=items;
					params = {};
					params['code'] = code;
	
					callback(null,fetchCmd);
				},(reason)=>{
					console.log(reason);
				}).catch((err)=>{
					console.log(err);
				});
					// callYZ('youzan.trade.selffetchcode.apply',params,(err,data)=>{
					// 	if(err){
					// 		callback(err);
					// 		return;
					// 	}
	
					// 	if(data && data.is_success == true){
					// 		callback(undefined,fetchCmd);
					// 	}else{
					// 		callback("fetch failed");
					// 	}
					// })
			}else{
				callback(null,fetchCmd);
			}
		});
	});	
}

function callYZ(api, params,callback) {

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
