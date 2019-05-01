"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const moment = require("moment");
const mysql = require("mysql");
var dbConfig = config.get('database');
var connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
});
function select(cmd, params) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            connection.query(cmd, params, function (error, results, fields) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    });
}
exports.select = select;
function update(cmd, params) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            connection.query(cmd, params, function (error, results, fields) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    });
}
exports.update = update;
/////////////////////////////////////////////
function savePOItem(code, tid, item, now) {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.update("insert into `PO`(`code`,`tid`,`productSN`,`productCount`,`updatetime`) \
		values(?,?,?,?,?)", [code, tid, item.productSN, item.productCount, now]);
    });
}
exports.savePOItem = savePOItem;
function savePO(po) {
    return __awaiter(this, void 0, void 0, function* () {
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
            });
        });
    });
}
////////////////////////////////////////////
function saveFetchItem(code, tid, fetchitem) {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.update("insert into `FetchRecord` (`code`,`tid`,`productSN`,`productCount`,`rackID`,`fetchTime`) \
		values (?,?,?,?,?,?)", [code, tid, fetchitem.productSN, fetchitem.productCount, fetchitem.rackID, fetchitem.fetchTime]);
    });
}
function saveFetch(fetchInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        fetchInfo.forEach((fetchItem) => {
            saveFetchItem(fetchInfo.code, fetchInfo.tid, fetchItem);
        });
    });
}
/////////////////////////////////////////////
function getFetchedOrderByTid(tid) {
    return __awaiter(this, void 0, void 0, function* () {
        var fetchedOrders = yield this.select("select * from `FetchRecord` where `tid`=?", [tid]);
        return fetchedOrders;
    });
}
exports.getFetchedOrderByTid = getFetchedOrderByTid;
function getFetchedOrderByCode(code) {
    return __awaiter(this, void 0, void 0, function* () {
        var fetchedOrders = this.select("select * from `FetchRecord` where `code`=?", [code]);
        return fetchedOrders;
    });
}
exports.getFetchedOrderByCode = getFetchedOrderByCode;
function localGetPOBy(field, value) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = yield this.select("select * from `PO` where `" + field + "`=?", [value]);
        return result;
    });
}
exports.localGetPOBy = localGetPOBy;
class POItem {
}
class PO {
}
exports.PO = PO;
//# sourceMappingURL=database.js.map