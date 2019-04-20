var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');

var fetch = require('./fetch');

var bluebird = require('bluebird');
var findProductChannelAsync = bluebird.promisify(fetch.findProductChannel);

function getOrderByTid(tid,callback) {
	params = {};
	params['tid'] = tid;
	callYZ('youzan.trade.get',params, function(err,data){
		callback(err,data);
	});
}

function checkOrderInFetchRecord(order,records){
	var exists = false;
	for(i=0; i< records.length; ++i){
		if(order.outer_item_id == records[i].productSN){
			//find fetch record
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

function calUnfetchedRecords(orders,dbResult){
	var retOrders = [];
	orders.forEach(function(order) {
		if(!checkOrderInFetchRecord(order,dbResult)){
			retOrders.push(order);
		}
	});

	return retOrders;
}

function fetchOrder(code,tid,rackSN, unfetchedOrder,callback){
	fetch.findProductChannel(rackSN,unfetchedOrder.outer_item_id, (channel)=>{
		item = buildCmdItem(unfetchedOrder.outer_item_id,
			channel,
			unfetchedOrder.num);
		fetch.saveFetchedOrder(code,tid,rackSN,unfetchedOrder,()=>{
			callback(undefined,item);
		})
	});
}

var fetchOrderAsync = bluebird.promisify(fetchOrder);

function fetchByCode(rackSN,code,callback) {
	params = {};
	params['code'] = code;
	callYZ('youzan.trade.selffetchcode.get', params,function(err,codeData){
		if(err){
			callback(err);
			return;
		}
		if(codeData.status == 1){
			callback("already fetched");
			return;
		}
		getOrderByTid(codeData.tid, function(err,tidData){
			if(err){
				callback(err);
				return;
			}
			fetch.getFetchedOrder(codeData.tid,function(dbResult){
				var unfetchedOrders = {};
				if(dbResult == undefined){
					unfetchedOrders = orders;
				}else{
					unfetchedOrders = calUnfetchedRecords(tidData.trade.orders,dbResult);
				}
				
				fetchCmd = {
					"code": code,
					"items": []
				}

				if(unfetchedOrders.length > 0){
					var fetches = [];
					unfetchedOrders.forEach((unfetchedOrder)=>{
						fetches.push(fetchOrderAsync(code, codeData.tid, rackSN,unfetchedOrder));
					});
	
					bluebird.all(fetches)
					.then((items)=>{
						fetchCmd.items=items;
						params = {};
						params['code'] = code;
						callYZ('youzan.trade.selffetchcode.apply',params,(err,data)=>{
							if(err){
								callback(err);
								return;
							}

							if(data && data.is_success == true){
								callback(undefined,fetchCmd);
							}else{
								callback("fetch failed");
							}
						})
						
					},(error)=>{
						console.log(error);
					});
				}else{
					callback(undefined,fetchCmd);
				}
			})
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
