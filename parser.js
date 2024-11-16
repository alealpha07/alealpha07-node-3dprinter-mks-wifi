class Parser {
    static parseTemperature(data) {
        const tempRegex = /T:(\d+) \/(\d+) B:(\d+) \/(\d+) T0:(\d+) \/(\d+) T1:(\d+) \/(\d+) @:(\d+) B@:(\d+)/;
        const match = data.match(tempRegex);
    
        if (match) {
            return {
                nozzleCurrent: parseInt(match[1], 10),
                nozzleTarget: parseInt(match[2], 10),
                bedCurrent: parseInt(match[3], 10),
                bedTarget: parseInt(match[4], 10),
                extruder0Current: parseInt(match[5], 10),
                extruder0Target: parseInt(match[6], 10),
                extruder1Current: parseInt(match[7], 10),
                extruder1Target: parseInt(match[8], 10),
                heaterPower: parseInt(match[9], 10),
                bedHeaterPower: parseInt(match[10], 10),
            };
        }
        return null;
    }

    static parsePrintingProgress(data) {
        const tempRegex = /M27 (\d+)/;
        const match = data.match(tempRegex);
    
        if (match) {
            return parseInt(match[1], 10);
        }
        return null;
    }

    static parsePrintingTime(data) {
        const tempRegex = /M992 (\d+:\d+:\d+)/;
        const match = data.match(tempRegex);
    
        if (match) {
            return match[1];
        }
        return null;
    }

    static parsePrintingFilename(data) {
        const tempRegex = /M994 1:\/([A-Za-z0-9_]+\.gcode);/;
        const match = data.match(tempRegex);
        if (match) {
            return match[1];
        }
        return null;
    }

    static parseFilenames(data){
        const lines = data.split("\n");
        if(lines && lines.length > 0){
            return lines;
        }
        return null;
    }

    static parseState(data) {
        const tempRegex = /M997 ([A-Z]+)/;
        const match = data.match(tempRegex);
        if (match) {
            return match[1];
        }
        return null;
    }

    static parseOk(data) {
        const tempRegex = /(ok)/;
        const match = data.match(tempRegex);
        if (match) {
            return match[1];
        }
        return null;
    }
}

module.exports = Parser;