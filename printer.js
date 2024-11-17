const Parser = require("./parser");
const net = require('net');

class Printer{
    #ip;
    #port;
    #client;
    #clientBusy;
    #minimumExtruderTemperature;
    #maximumExtruderTemperature;
    #minimumBedTemperature;
    #maximumBedTemperature;

    constructor(ip, port, minimumExtruderTemperature=0, maximumExtruderTemperature=280, minimumBedTemperature=0, maximumBedTemperature=100){
        if(!ip || !port){
            throw(`Error: ip and port are mandatory!`);
        }
        this.#ip = ip;
        this.#port = port;
        this.#client = new net.Socket();
        this.#minimumExtruderTemperature=minimumExtruderTemperature;
        this.#maximumExtruderTemperature=maximumExtruderTemperature;
        this.#minimumBedTemperature=minimumBedTemperature;
        this.#maximumBedTemperature=maximumBedTemperature;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.#client.connect(this.#port, this.#ip, () => {
                resolve(`Connected to printer at ${this.ip}:${this.port}`);
            });
    
            this.#client.on('error', (err) => {
                reject(`Connection error: ${err.message}`);
            });
        });
    }
    
    disconnect(){
        return new Promise((resolve, reject) => {
            this.#client.end(() => {
                resolve(`Disconnected from printer.`);
            });
    
            this.#client.on('error', (err) => {
                reject(`Disconnection error: ${err.message}`);
            });
        });
    }

    #sendCommand(command, noreply=false, waitok=false) {
        return new Promise(async (resolve, reject) => {
            if(this.#clientBusy){
                setTimeout(this.#sendCommand(command, noreply, waitok), 500);
            }
            this.#clientBusy = true;
            let responseBuffer = '';
            this.#client.write(`${command}\n`);
    
            this.#client.on('data', (data) => {
                responseBuffer += data.toString();

                if (responseBuffer.includes('ok') && !noreply && !waitok) {
                    responseBuffer = responseBuffer.replace('ok', '').trim();
                }

                if (waitok && (responseBuffer.trim() && responseBuffer.includes('ok'))) {
                    responseBuffer = responseBuffer.replace('ok', '').trim();
                    responseBuffer = responseBuffer.replace('Begin file list', '').trim();
                    responseBuffer = responseBuffer.replace('End file list', '').trim();
                    responseBuffer = responseBuffer.replaceAll(/.*\.DIR/g, '').trim();
                    this.#client.removeAllListeners('data');
                    this.#client.removeAllListeners('error');
                    this.#clientBusy = false;
                    resolve(responseBuffer);
                }
                else if (!waitok && responseBuffer.trim()){
                    this.#client.removeAllListeners('data');
                    this.#client.removeAllListeners('error');
                    this.#clientBusy = false;
                    resolve(responseBuffer);
                }
            });
    
            this.#client.on('error', (err) => {
                this.#clientBusy = false;
                reject(`Error receiving data: ${err.message}`);
            });
        });
    }

    getTemperature(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M105").then((data) => {
                let parsedData = Parser.parseTemperature(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    getPrintingProgress(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M27").then((data) => {
                let parsedData = Parser.parsePrintingProgress(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    getPrintingTime(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M992").then((data) => {
                let parsedData = Parser.parsePrintingTime(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    getPrintingFilename(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M994").then((data) => {
                let parsedData = Parser.parsePrintingFilename(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    getState(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M997").then((data) => {
                let parsedData = Parser.parseState(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    getFilenames(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M20", false, true).then((data) => {
                let parsedData = Parser.parseFilenames(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    startPrinting(filename){
        return new Promise((resolve, reject) => {
            if(!filename){
                reject(`Error: filename is mandatory!`);
            }
            this.#sendCommand(`M23 ${filename}`).then((data) => {
                this.#sendCommand(`M24`, true).then((data) => {
                    let parsedData = Parser.parseOk(data);
                    resolve(parsedData);
                }).catch((err) => {
                    reject(`Error receiving data: ${err.message}`);
                })
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
            
        });
    }

    home(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("G28", true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    abort(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M26", true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    pause(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M25", true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    resume(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M24", true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    startFan(speed=255){
        return new Promise((resolve, reject) => {
            if(speed < 0 || speed > 255){
                reject(`Error speed must be between 0 and 255, got: ${speed}`);
            }
            this.#sendCommand(`M106 ${speed}`, true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    stopFan(){
        return new Promise((resolve, reject) => {
            this.#sendCommand("M107", true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    setExtruderTemperature(temperature=0, extruder=0){
        return new Promise((resolve, reject) => {
            if(temperature < this.#minimumExtruderTemperature || temperature > this.#maximumExtruderTemperature){
                reject(`Error temperature must be between ${this.#minimumExtruderTemperature} and ${this.#maximumExtruderTemperature}, got: ${temperature}`);
            }
            if(extruder < 0 || extruder > 1){
                reject(`Error extruder must be 0 or 1, got: ${extruder}`);
            }
            this.#sendCommand(`M104 T${extruder} S${temperature}`, true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }

    setBedTemperature(temperature=0){
        return new Promise((resolve, reject) => {
            if(temperature < this.#minimumBedTemperature || temperature > this.#maximumBedTemperature){
                reject(`Error temperature must be between ${this.#minimumBedTemperature} and ${this.#maximumBedTemperature}, got: ${temperature}`);
            }
            this.#sendCommand(`M140 S${temperature}`, true).then((data) => {
                let parsedData = Parser.parseOk(data);
                resolve(parsedData);
            }).catch((err) => {
                reject(`Error receiving data: ${err.message}`);
            })
        });
    }
}

module.exports = Printer;
