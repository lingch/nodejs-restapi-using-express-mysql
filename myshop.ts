import express = require('express')
const router = express.Router()
import request = require('request');
import MQ = require('./mq');
import fetch = require('./fetch')
import fs = require('fs');
import { Cmd } from './fetch';

import { stringify } from 'querystring';

export class POListener extends MQ.Listener{
    async init(host, myName){
        var qSender = config.get('qSender');
        await super.init(host,qSender,'sync.PO',(msg)=>{
            database.savePO(msg);
        });
    }
}

export class FetchedListener extends MQ.Listener{
    async init(host, myName){
        var qSender = config.get('qSender');

        await super.init(host,qSender,'sync.fetched',(msg)=>{
            if(msg.headers.sender != this.myName){
                database.saveFetchedItem(msg.headers.code,msg.headers.tid,msg);
            }
        });
    }
}

var fetchedListener = new FetchedListener();
fetchedListener.init(config.get('cmdQueueHost'),config.get('shopName'));


router.get('/fetch/byCode/:code',(req,res) =>{
    var rack = req.headers.rack;
    var set: Array<number> = req.body.set;
    var code = req.param.code;

	fetch.fetchPO(rack,set,code).then((po) =>{
        res.status(200).send(po);
    });
});

router.get('/fetch/byTid/:tid',(req,res) =>{
    var rack = req.headers.rack;
    var set: Array<number> = req.headers.set;
    var tid = req.param.tid;

	fetch.fetchPO(rack,set,tid).then((po) =>{
        res.status(200).send(po);
    });
});
  


