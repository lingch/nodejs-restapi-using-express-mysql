var YZClient = require('yz-open-sdk-nodejs');
var Token = require('./node_modules/yz-open-sdk-nodejs/Token');


function getOrderByTid(tid) {
	params = {};
	params['tid'] = tid;
	var data = callYZ('youzan.trade.get',params);
}

function getOrderByCode(code) {
	params = {};
	params['code'] = code;
	var data = callYZ('youzan.trade.selffetchcode.get', params);

	getOrderByTid(data.tid);
}

function callYZ(api, params) {

	require("./token").getToken(function(mytoken) {

		var myClient = new YZClient(new Token(mytoken));

		var promise = myClient.invoke(api, '3.0.0', 'GET', params, undefined);

		promise.then(function(resp) {
			//console.log('resp: ' + resp.body);
			var data = JSON.parse(resp.body).response;
			console.log(data);

			return data;

		}, function(err) {
			console.log('err: ' + err);
		}, function(prog) {
			console.log('prog: ' + prog);
		});
	});

}

getOrderByCode("80392436389");
