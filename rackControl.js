var amqp = require('amqplib/callback_api');
var fs = require('fs');

exports.RackControl = function (id,host, port) {
    this.rackConfig = JSON.parse(fs.readFileSync('rackConfig.json', 'utf8'));

    amqp.connect("amqp://" + host, function (err, conn) {
        conn.createChannel(function (err, ch) {
            var qName = this.rackConfig.id;

            ch.assertQueue(qName, { durable: false });

            ch.consume(qName, function (msg) {
                console.log(" [x] Received %s", msg.content.toString());
            }, { noAck: true });

        });
    });
}



