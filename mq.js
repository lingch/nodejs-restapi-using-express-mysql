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

class FetchPublisher extends Publisher{

    async init(){
        await super.init('sync');
    }

    async publish(msg) {
        msg.headers.object = 'Fetch';
        await super.publish(msg);
    }
}

class POPublisher extends Publisher{

    async init(){
        await super.init('sync');
    }

    async publish(msg) {
        msg.headers.object = 'PO';
        await super.publish(msg);
    }
}

class FetchListener{
    async init(qName){
        this.ex = ex;
        [this.conn, this.channel] = await connectToQueue();

        this.channel.consume(qName,(msg)=>{
            if(msg.headers.sender != qName){
                database.saveFetch(msg);
            }
        });
    }
}

class Listener{
    async init(qName,callback){
        [this.conn, this.channel] = await connectToQueue();

        this.channel.consume(myname+'.'+qName,callback);
    }
}

class POListener extends Listener{
    async init(){
        await super.init('sync',(msg)=>{

        })
    }
}

class FetchListener extends Listener{
    async init(){
        await super.init('fetch',(msg)=>{
            
        })
    }
}


exports.FetchPublisher = FetchPublisher;
exports.POListener = POListener;
