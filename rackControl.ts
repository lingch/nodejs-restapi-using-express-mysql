import amqp = require('amqplib/callback_api');
import fs = require("fs");
import fetch = require('./fetch');
import MQ = require('./MQ');
import config = require('config');
var gpio = require("pi-gpio");

import express = require('express');
var router = express.Router();

async function setGPIO(port: number, value: number){
    return new Promise((resolve,reject)=>{
        gpio.open(port, "output", function(err) {		// Open pin port for output
            if(err){
                reject('cannot open gpio: ' + err);
            }
            gpio.write(port, value, function() {			// Set pin port high (1)
                gpio.close(port);						// Close pin 16
                resolve();
            });
    });
})
}

async function toggleGPIO(port: number){
    await setGPIO(port,1);
    setTimeout(() => {
        setGPIO(port,0);
    }, 500);
}


export class CmdListener extends MQ.Listener{
    async init(host, myName){
        await super.init(host,myName,'sync.cmd',(msg)=>{
            toggleGPIO(msg.port);
        });
    }
}

var rackConfig = JSON.parse(fs.readFileSync('rackConfig.json', 'utf8'));
var cmdPub = new MQ.CmdPublisher();
cmdPub.init(config.get('cmdQueueHost'));


router.post('/events/scanner/:code',(req,res)=>{
    try{
      var client = req.headers['x-clientdn'];
      var code = req.params['code'];
  
      //TODO:check the code type to see if we can process it

      fetch.fetchPO(client,code);
      res.status(200).send();
    }catch(Error){
      res.status(501).send();
    }
  });




