var os = require('os');
if (os.platform() == 'win32') {  
    if (os.arch() == 'ia32') {
        var chilkat = require('@chilkat/ck-node11-win-ia32');
    } else {
        var chilkat = require('@chilkat/ck-node11-win64'); 
    }
} else if (os.platform() == 'linux') {
    if (os.arch() == 'arm') {
        var chilkat = require('@chilkat/ck-node11-arm');
    } else if (os.arch() == 'x86') {
        var chilkat = require('@chilkat/ck-node11-linux32');
    } else {
        var chilkat = require('@chilkat/ck-node11-linux64');
    }
} else if (os.platform() == 'darwin') {
    var chilkat = require('@chilkat/ck-node11-macosx');
}

import MQ = require('./MQ');
import { Cmd } from './fetch';

var rackConfig = require('./config/rackConfig.json');

const pem = require("pem");
const fs = require("fs");

//var gpio = require("pi-gpio");

var gpioStatus: Array<number> = [];
for(var i=0;i<30;++i){
    gpioStatus[i] = 0;
}

async function readCert(){
    return new Promise((resolve,reject)=>{
        const pfx = fs.readFileSync(__dirname + '/' + rackConfig.cert);
        pem.readPkcs12(pfx, { p12Password: rackConfig.certPwd }, (err, cert) => {
            console.log(cert);
            if(err){
                reject(err);
            }else{
                resolve(cert);
            }
        });
    });
}



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



var cert = readCert().then((cert) => {
    var rackConfig = require('./config/rackConfig.json');
    var cmdListener = new CmdListener();
    cmdListener.init(rackConfig.cmd.host, rackConfig.name);
    
});


