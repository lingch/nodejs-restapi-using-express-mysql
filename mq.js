var amqp = require('amqplib/callback_api');
var config = require('config');

var host = config.get('queueHost');

async function connectToEx(ex, type, durable) {
    return new Promise((resolve, reject) => {
        amqp.connect("amqp://" + host + "/myshop", function (err, conn) {
            if (err) {
                reject(err);
            } else {
                conn.createChannel(function (err, ch) {
                    if (err) {
                        reject(err);
                    } else {
                        ch.assertExchange(ex, type, { durable: durable });
                        resolve([conn, ch]);
                    }
                });
            }
        });
    });
}

async function connectToQueue(ex,qName,callback,ack){
    return new Promise((resolve, reject) => {
        amqp.connect("amqp://" + host + "/myshop", function (err, conn) {
            if (err) {
                reject(err);
            } else {
                conn.createChannel(function (err, channel) {
                    if (err) {
                        reject(err);
                    } else {
                        channel.assertQueue(qName, {exclusive: true}, function(err, q) {
                            if(err){
                                reject(err);
                            }else{
                                channel.bindQueue(q.queue, ex, '');
                      
                                channel.consume(q.queue, callback, {noAck: !ack});
                                resolve([conn,channel,q]);
                            }
                        });
                    }
                });
            }
        });
    });
}

class PublishQueue {

    async init(ex, durable){
        this.ex = ex;
        [this.conn, this.channel] = await connectToEx(ex, 'fanout', durable);
    }

    sendMsg(msg) {
        this.channel.publish(this.ex, '', new Buffer(msg));
    }
}

class RecvQueue{
    async init(ex, qName,msgCallback){
        this.ex = ex;
        [this.conn, this.channel, this.q] = await connectToQueue(ex, qName, msgCallback, true);
    }
}

exports.PublishQueue = PublishQueue;
exports.RecvQueue = RecvQueue;
