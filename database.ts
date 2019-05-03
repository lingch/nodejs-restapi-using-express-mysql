import config = require('config');
import moment = require('moment');
import mysql = require('mysql');

var dbConfig = config.get('database');

var connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
});

export async function select(cmd, params) {
    return new Promise((resolve, reject) => {
        connection.query(cmd, params, function (error, results, fields) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

export async function update(cmd, params) {
    return new Promise((resolve, reject) => {
        connection.query(cmd, params, function (error, results, fields) {
            if (error) {
                reject(error);
            } else {
                resolve(undefined);
            }
        });
    });
}

/////////////////////////////////////////////
export async function savePOItem(code, tid, item: POItem, now) {
    await this.update("insert into `PO`(`code`,`tid`,`productSN`,`productCount`,`updatetime`) \
		values(?,?,?,?,?)", [code, tid, item.productSN, item.productCount, now]);
}

export async function savePO(po: PO) {
    return new Promise((resolve, reject) => {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');

        //got, save to database
        connection.beginTransaction();
        var ps = [];
        for (var i = 0; i < po.items.length; ++i) {
            ps.push(savePOItem(po.code, po.tid, po.items[i], now));
        }
        Promise.all(ps).then((values) => {
            connection.commit(function (err) {
                if (err) {
                    connection.rollback(function () {
                        reject(err);
                    });
                }
            });
        }, (err) => {
            connection.rollback(function () {
                throw reject(err);
            });
        })
    });
}
////////////////////////////////////////////
export async function saveFetchedItem(code, tid, fetcheditem: FetchedItem, decreaseStock: boolean) {
    var now = moment().format('YYYY-MM-DD HH:mm:ss');

    await this.update(
        "insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)",
        [code, tid, fetcheditem.product.productSN, fetcheditem.product.productCount, fetcheditem.rack, now]);

        if(decreaseStock){
            await this.update("update `RackInstance` set `productCount`=`productCount`-? where `ID`=?",
            [fetcheditem.product.productCount,fetcheditem.rack]);
        }
}

/////////////////////////////////////////////
export async function localGetPOBy(table:string, field: string, value) {
    var result = await this.select("select * from `"+table+"` where `" + field + "`=?", [value]);
    var po = new PO();
    if(result.length ==0){
        return null;
    }else{
        po.code = result[0].code;
        po.tid= result[0].tid;
        for(var i=0;i<result.length;++i){
            po.items.push(new POItem(result[i].productSN,result[i].productCount));
        }
    }
    return po;
}

export async function getFetchedBy(field: string, value) {
    return await localGetPOBy('fetched',field,value);
}

export async function getPOBy(field: string, value) {
    return await localGetPOBy('PO',field,value);
}

export class POItem {
    productSN: string;
    productCount: number;
    constructor(productSN: string,productCount:number){
        this.productSN = productSN;
        this.productCount = productCount;
    }
}

export class PO {
    code: string;
    tid: string;
    items: POItem[];
}

export class FetchedItem{
    product: POItem;
    rack: string;

    constructor(rack,product: POItem){
        this.rack = rack;
        this.product = product;
    }
}

export class RackInstance{
    shop: string;
    rack: string;
    set: number;
    channel: string;
    productSN: string;
    productCount: number;
}

