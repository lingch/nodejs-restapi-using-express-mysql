import MQ = require('./MQ');
import { Cmd } from './fetch';

var gpio = require("pi-gpio");

async function setGPIO(port: number, value: number) {
    return new Promise((resolve, reject) => {
        gpio.open(port, "output", function (err) {		// Open pin port for output
            if (err) {
                reject('cannot open gpio: ' + err);
            }
            if(value > 0){
                gpioStatus[port]++;
            }else{
                gpioStatus[port]--;
            }

            if((value == 0) && (gpioStatus[port] != 0) ){
                //dont really set to 0
                ;
            }else{
                gpio.write(port, value, function () {			// Set pin port high (1)
                    gpio.close(port);						// Close pin 16
                    resolve();
                });
            }
        });
    })
}

async function toggleGPIO(port: number) {
    await setGPIO(port, 1);
    setTimeout(() => {
        setGPIO(port, 0);
    }, 500);
}


class CmdListener extends MQ.Listener {
    async init(host, myName) {
        await super.init(host, myName, 'cmd', (msg) => {
            var cmd: Cmd = msg.body;
            if(cmd.push){
                toggleGPIO(rackConfig.set[cmd.push.set].lock);
            }
        });
    }
}

var gpioStatus: Array<number> = [];
for(var i=0;i<30;++i){
    gpioStatus[i] = 0;
}

var rackConfig = require('./config/rackConfig.json');
var cmdListener = new CmdListener();
cmdListener.init(rackConfig.cmd.host, rackConfig.name);


