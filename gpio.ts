var gpio = require("pi-gpio");

var gpioStatus: Array<number> = [];
for(var i=0;i<30;++i){
    gpioStatus[i] = 0;
}

export async function setGPIO(port: number, value: number) {
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

export async function toggleGPIO(port: number) {
    await setGPIO(port, 1);
    setTimeout(() => {
        setGPIO(port, 0);
    }, 500);
}
