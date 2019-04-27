


var gpio = require("pi-gpio");

exports.Lock = function (gpioPort){
    this.gpioPort = gpioPort;
}


Lock.prototype.open = function (){
    gpio.open(gpioPort, "output", function(err) {
        gpio.write(gpioPort, 1, function() {
            setTimeout(() => {
                gpio.write(gpioPort, 0, function() {
                    gpio.close(gpioPort);	
                });
            }, 500);
        });
    });
}
