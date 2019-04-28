var amqp = require('amqplib/callback_api');

var host = 'mywxstore.cn';

async function connectToMq(ex, type, durable) {
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

async function bindQueue(channel, qName,exclusive,callback,ack){
    return new Promise((resolve,reject) => {
        channel.assertQueue(qName, {exclusive: exclusive}, function(err, q) {
            if(err){
                reject(err);
            }else{
                channel.bindQueue(q.queue, ex, '');
      
                channel.consume(q.queue, callback, {noAck: !ack});
                resolve(q);
            }
    });
});
}
class FanOutQueue {
    async constructor(ex, durable,qName) {
        this.ex = ex;
        [this.conn, this.channel] = await connectToMq(ex, 'fanout', durable);

        
            

    }

    sendMsg(msg) {
        this.ch.publish(this.ex, '', new Buffer(msg));
    }
}

class QueueRecv{
    async constructor(ex, durable,msgCallback){
        this.ex = ex;
        [this.conn, this.channel] = await connectToMq(ex, 'fanout', durable);

        await bindQueue(this.channel,qName,true,msgCallback,true);
    }
}

exports.FanOutQueue = FanOutQueue;
exports.QueueRecv = QueueRecv;
