


var gpio = require("pi-gpio");

exports.Indicator = function (gpioPortR,gpioPortG,gpioPortY){
    this.gpioPortR = gpioPortR;
    this.gpioPortG = gpioPortG;
    this.gpioPortY = gpioPortY;
}


Indicator.prototype.toggle = function (gpioPortNum){
    gpio.open(gpioPortNum, "output", function(err) {
        gpio.write(gpioPortNum, 1, function() {
            setTimeout(() => {
                gpio.write(gpioPortNum, 0, function() {
                    gpio.close(gpioPortNum);	
                });
            }, 3000);
        });
    });
}

Indicator.prototype.toggleR = function(){
    this.toggle(this.gpioPortR);
}

Indicator.prototype.toggleG = function(){
    this.toggle(this.gpioPortG);
}
Indicator.prototype.toggleY = function(){
    this.toggle(this.gpioPortY);
}


