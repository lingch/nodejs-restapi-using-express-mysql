var Lock = require('./lock');
var Indicator = require('./indicator');

exports.Door = function(id,gpioPortR,gpioPortG,gpioPortB,gpioPortDoor){
    this.id = id;
    this.indicator = new Indicator(gpioPortR,gpioPortG,gpioPortB);
    this.lock = new Lock(gpioPortDoor);
}


exports.open = function(){
    this.lock.open();
    this.indicator.toggleG();
}

exports.warn = function(){
    this.indicator.toggleY();
}

