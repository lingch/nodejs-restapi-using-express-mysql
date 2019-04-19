var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');

var fetch = require('./fetch');

var bluebird = require('bluebird');
var findProductChannelAsync = bluebird.promisify(fetch.findProductChannel);

function getOrderByTid(tid,callback) {
	params = {};
	params['tid'] = tid;
	callYZ('youzan.trade.get',params, function(data){
		callback(data);
	});
}

function checkOrderInFetchRecord(order,records){
	var exists = false;
	for(i=0; i< records.length; ++i){
		if(order.outer_item_id == record.productSN){
			//find fetch record
			return true;
		}
	}

	//fetch record not found
	return false;
}

function pushCmdItem(fetchCmd, sn,channel,count){
	var cmd = {};
	cmd.sn = unfetchedOrder.outer_item_id;
	cmd.channel = 1;
	cmd.count = 1;

	fetchCmd.items.push(cmd);
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

function fetchOrder(rackSN, unfetchedOrder,fetchCmd,callback){
	findProductChannel(rackSN,unfetchedOrder.outer_item_id, channel=>{
		pushCmdItem(fetchCmd,
			unfetchedOrder.outer_item_id,
			channel,
			unfetchedOrder.num);
		fetch.saveFetchedOrder(rackSN,code,codeData.tid,unfetchedOrder,()=>{
			callback(fetchCmd);
		})
	});
}

var fetchOrderAsync = bluebird.promisify(fetchOrder);

function getOrderByCode(rackSN,code,callback) {
	params = {};
	params['code'] = code;
	callYZ('youzan.trade.selffetchcode.get', params,function(codeData){
		getOrderByTid(codeData.tid, function(tidData){
			fetch.getFetchedOrder(codeData.tid,function(dbResult){
				var unfetchedOrders = calUnfetchedRecords(tidData.trade.orders,dbResult);

				
				fetchCmd = {
					"code": code,
					"items": []
				}

				var fetches = [];
				unfetchedOrders.forEach((unfetchedOrder)=>{
					fetches.push(fetchOrderAsync(rackSN,unfetchedOrder,fetchCmd));
				});

				bluebird.all(fetches).then(()=>{
					callback();
				});
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
			var data = JSON.parse(resp.body).response;
			console.log(data);

			callback(data);

		}, function(err) {
			console.log('err: ' + err);
		}, function(prog) {
			console.log('prog: ' + prog);
		});
	});

}

getOrderByCode("androidtest","80392436389",function (data){
	console.log(data);
});

exports.getOrderByCode = getOrderByCode;
