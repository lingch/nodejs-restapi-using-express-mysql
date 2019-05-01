var amqp = require('amqplib/callback_api');
var config = require('config');

var host = config.get('queueHost');

var myname = config.get('shopname');

async function connectToQSvr() {
    return new Promise((resolve, reject) => {
        amqp.connect("amqp://" + host + "/myshop", function (err, conn) {
            if (err) {
                reject(err);
            } else {
                conn.createChannel(function (err, ch) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve([conn, ch]);
                    }
                });
            }
        });
    });
}

async function connectToQueue(qName,callback,ack){
    var [conn,channel] = await connectToQSvr();

    channel.consume(qName, callback, {noAck: !ack});

    return [conn,channel];
}

class Publisher {

    async init(ex){
        this.ex = ex;
        [this.conn, this.channel] = await connectToQSvr();
    }

    async publish(msg) {
        this.channel.publish(this.ex, '', new Buffer(msg));
    }
}

class POPublisher extends Publisher{

    async init(){
        await super.init('sync.PO');
    }

    async publish(msg) {
        await super.publish(msg);
    }
}

class FetchPublisher extends Publisher{

    async init(){
        this.sender = require('config').get('qSender');
        await super.init('sync.fetch');
    }

    async publish(msg) {
        msg.headers.sender = this.sender;
        await super.publish(msg);
    }
}




class Listener{
    async init(myName,qName,callback){
        [this.conn, this.channel] = await connectToQueue();

        this.channel.consume(myName+'.'+qName,callback);
    }
}

class POListener extends Listener{
    async init(){
        this.sender = require('config').get('qSender');
        await super.init(this.sender,'sync.PO',(msg)=>{
            database.savePO(msg);
        });
    }
}
class FetchListener extends Listener{
    async init(){
        this.sender = require('config').get('qSender');

        await super.init(this.sender,'sync.fetch',(msg)=>{
            if(msg.headers.sender != this.sender){
                database.saveFetch(msg);
            }
        });
    }
}


exports.POPublisher = POPublisher;
exports.POListener = POListener;
exports.FetchPublisher = FetchPublisher;
exports.FetchListener = FetchListener;

