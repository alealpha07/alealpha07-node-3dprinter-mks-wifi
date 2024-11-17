const Parser = require("./parser");
const net = require('net');

function replaceLastOccurrence(input, target, replacement) {
    const lastIndex = input.lastIndexOf(target);
    if (lastIndex === -1) {
        return input;
    }
    return input.substring(0, lastIndex) + replacement + input.substring(lastIndex + target.length);
}

class Printer {
    #ip;
    #port;
    #client;
    #minimumExtruderTemperature;
    #maximumExtruderTemperature;
    #minimumBedTemperature;
    #maximumBedTemperature;
    #commandQueue;
    #isConnected;

    constructor(ip, port, minimumExtruderTemperature = 0, maximumExtruderTemperature = 280, minimumBedTemperature = 0, maximumBedTemperature = 100) {
        if (!ip || !port) {
            throw new Error("Error: ip and port are mandatory!");
        }
        this.#ip = ip;
        this.#port = port;
        this.#client = new net.Socket();
        this.#minimumExtruderTemperature = minimumExtruderTemperature;
        this.#maximumExtruderTemperature = maximumExtruderTemperature;
        this.#minimumBedTemperature = minimumBedTemperature;
        this.#maximumBedTemperature = maximumBedTemperature;
        this.#commandQueue = [];
        this.#isConnected = false;
    }

    async connect(retries = 3, delay = 2000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    if (this.#isConnected) {
                        resolve("Already connected");
                        return;
                    }
                    this.#client.connect(this.#port, this.#ip, () => {
                        this.#isConnected = true;
                        resolve(`Connected to printer at ${this.#ip}:${this.#port}`);
                        this.#processQueue();
                    });

                    const errorListener = (err) => {
                        this.#client.removeListener('error', errorListener);
                        this.#client.removeListener('close', closeListener);
                        reject(new Error(`Connection error: ${err.message}`));
                    };

                    const closeListener = () => {
                        this.#client.removeListener('error', errorListener);
                        this.#client.removeListener('close', closeListener);
                        this.#isConnected = false;
                    };

                    this.#client.once('error', errorListener);
                    this.#client.once('close', closeListener);
                });
                return;
            } catch (err) {
                console.error(`Connection attempt ${attempt} failed: ${err.message}`);
                if (attempt < retries) await new Promise(res => setTimeout(res, delay));
                else throw new Error("Failed to connect after multiple attempts");
            }
        }
    }

    disconnect() {
        return new Promise((resolve, reject) => {
            if (!this.#isConnected) {
                resolve("Already disconnected");
                return;
            }
    
            this.#isConnected = false;
    
            const cleanup = () => {
                this.#client.removeListener('error', errorListener);
                this.#client.removeListener('close', closeListener);
                this.#client.removeAllListeners();
            };
    
            const errorListener = (err) => {
                cleanup();
                reject(`Disconnection error: ${err.message}`);
            };
    
            const closeListener = () => {
                cleanup();
                resolve("Disconnected from printer.");
            };

            this.#client.on('error', errorListener);
            this.#client.on('close', closeListener);
            this.#client.end(() => {
            });
            this.#client.destroy();
        });
    }

    #enqueueCommand(command, noreply = false, waitok = false) {
        return new Promise((resolve, reject) => {
            this.#commandQueue.push({
                command,
                noreply,
                waitok,
                resolve,
                reject
            });
            if (this.#commandQueue.length === 1 && this.#isConnected) {
                this.#processQueue();
            }
        });
    }

    #processQueue() {
        if (this.#commandQueue.length === 0 || !this.#isConnected) return;
        const { command, noreply, waitok, resolve, reject } = this.#commandQueue[0];
        setTimeout(() => {
            this.#sendCommand(command, noreply, waitok).then((result) => {
                resolve(result);
                this.#commandQueue.shift();
                this.#processQueue();
            }).catch((err) => {
                reject(err);
                this.#commandQueue.shift();
                this.#processQueue();
            });
        }, 50);
    }

    #sendCommand(command, noreply = false, waitEndFileList = false) {
        return new Promise((resolve, reject) => {
            let responseBuffer = '';
            this.#client.write(`${command}\n`);

            const dataListener = (data) => {
                responseBuffer += data.toString();

                if (responseBuffer.includes('ok') && !noreply && !waitEndFileList) {
                    responseBuffer = responseBuffer.replace('ok', '').trim();
                }

                if (waitEndFileList && (responseBuffer.trim() && responseBuffer.includes('End file list') && responseBuffer.includes('ok'))) {
                    responseBuffer = responseBuffer.replace('Begin file list', '').trim();
                    responseBuffer = responseBuffer.replace('End file list', '').trim();
                    responseBuffer = responseBuffer.replaceAll(/.*\.DIR/g, '').trim();
                    this.#client.removeListener('data', dataListener);
                    this.#client.removeListener('error', errorListener);
                    resolve(responseBuffer);
                } else if (!waitEndFileList && responseBuffer.trim()) {
                    this.#client.removeListener('data', dataListener);
                    this.#client.removeListener('error', errorListener);
                    resolve(responseBuffer);
                }
            };

            const errorListener = (err) => {
                this.#client.removeListener('data', dataListener);
                this.#client.removeListener('error', errorListener);
                reject(new Error(`Error receiving data: ${err.message}`));
            };

            this.#client.on('data', dataListener);
            this.#client.on('error', errorListener);
        });
    }

    getTemperature() {
        return this.#enqueueCommand("M105").then(Parser.parseTemperature);
    }

    getPrintingProgress() {
        return this.#enqueueCommand("M27").then(Parser.parsePrintingProgress);
    }

    getPrintingTime() {
        return this.#enqueueCommand("M992").then(Parser.parsePrintingTime);
    }

    getPrintingFilename() {
        return this.#enqueueCommand("M994").then(Parser.parsePrintingFilename);
    }

    getState() {
        return this.#enqueueCommand("M997").then(Parser.parseState);
    }

    getFilenames() {
        return this.#enqueueCommand("M20", false, true).then(Parser.parseFilenames);
    }

    startPrinting(filename) {
        if (!filename) return Promise.reject(`Error: filename is mandatory!`);
        return this.#enqueueCommand(`M23 ${filename}`)
            .then(() => this.#enqueueCommand("M24", true))
            .then(Parser.parseOk);
    }

    home() {
        return this.#enqueueCommand("G28", true).then(Parser.parseOk);
    }

    abort() {
        return this.#enqueueCommand("M26", true).then(Parser.parseOk);
    }

    pause() {
        return this.#enqueueCommand("M25", true).then(Parser.parseOk);
    }

    resume() {
        return this.#enqueueCommand("M24", true).then(Parser.parseOk);
    }

    startFan(speed = 255) {
        if (speed < 0 || speed > 255) return Promise.reject(`Error: speed must be between 0 and 255, got: ${speed}`);
        return this.#enqueueCommand(`M106 ${speed}`, true).then(Parser.parseOk);
    }

    stopFan() {
        return this.#enqueueCommand("M107", true).then(Parser.parseOk);
    }

    setExtruderTemperature(temperature = 0, extruder = 0) {
        if (temperature < this.#minimumExtruderTemperature || temperature > this.#maximumExtruderTemperature) {
            return Promise.reject(`Error: temperature must be between ${this.#minimumExtruderTemperature} and ${this.#maximumExtruderTemperature}, got: ${temperature}`);
        }
        if (extruder < 0 || extruder > 1) {
            return Promise.reject(`Error: extruder must be 0 or 1, got: ${extruder}`);
        }
        return this.#enqueueCommand(`M104 T${extruder} S${temperature}`, true).then(Parser.parseOk);
    }

    setBedTemperature(temperature = 0) {
        if (temperature < this.#minimumBedTemperature || temperature > this.#maximumBedTemperature) {
            return Promise.reject(`Error: temperature must be between ${this.#minimumBedTemperature} and ${this.#maximumBedTemperature}, got: ${temperature}`);
        }
        return this.#enqueueCommand(`M140 S${temperature}`, true).then(Parser.parseOk);
    }
}

module.exports = Printer;
