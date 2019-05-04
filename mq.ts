import amqp = require('amqplib/callback_api');
import config = require('config');
import database = require('./database');


var host = config.get('queueHost');
var myname = config.get('shopName');

export async function connectToQSvr(host: string) {
    return new Promise((resolve, reject) => {
        amqp.connect("amqp://" + host + "/myshop", function (err, conn) {
            if (err) {
                reject(err);
            } else {
                conn.createChannel(function (err, ch) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(new Array([conn, ch]));
                    }
                });
            }
        });
    });
}

export class Publisher {

    ex:string;
    conn;
    channel;


    async init(host, ex){
        this.ex = ex;
        var ret = await connectToQSvr(host);
        this.conn = ret[0];
        this.channel = ret[1];
    }

    async publish(msg) {
        this.channel.publish(this.ex, '', new amqp.Buffer(msg));
    }
}

export class POPublisher extends Publisher{

    async init(){
        await super.init(host,'sync.PO');
    }
}

export class FetchedPublisher extends Publisher{
    sender:string;

    async init(host){
        this.sender = config.get('qSender');
        await super.init(host,'sync.fetched');
    }

    async publish(msg) {
        msg.headers.sender = this.sender;
        await super.publish(msg);
    }
}

export class Listener{

    conn;
    channel;
    myName: string;

    async init(host: string,myName:string,qName:string,callback){
        this.myName = myName;

        var ret = await connectToQSvr(host);

        this.conn = ret[0];
        this.channel = ret[1];

        this.channel.consume(myName+'.'+qName,callback);
    }
}




