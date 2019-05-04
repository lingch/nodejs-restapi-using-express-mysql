var os = require('os');

import MQ = require('./MQ');
import { Cmd } from './fetch';

if (os.platform() == 'linux') {
    var gpio = require('./gpio');
}

var rackConfig = require('./config/rackConfig.json');

const pem = require("pem");
const fs = require("fs");

async function readCert() {
    return new Promise((resolve, reject) => {
        const pfx = fs.readFileSync(__dirname + '/' + rackConfig.cert);
        pem.readPkcs12(pfx, { p12Password: rackConfig.certPwd }, (err, cert) => {
            console.log(cert);
            if (err) {
                reject(err);
            } else {
                pem.readCertificateInfo(cert.cert, (err, info) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            }
        });
    });
}

class CmdListener extends MQ.Listener {
    async init(host, myName) {
        await super.init(host, myName, 'cmd', (msg) => {
            var cmd: Cmd = msg.body;
            if (cmd.push) {
                if (os.platform() == 'linux') {
                    gpio.toggleGPIO(rackConfig.set[cmd.push.set].lock);
                }
            }
        });
    }
}

readCert().then((certInfo: any) => {
    var rackConfig = require('./config/rackConfig.json');
    var cmdListener = new CmdListener();
    cmdListener.init(rackConfig.cmd.host, certInfo.commonName);
});

