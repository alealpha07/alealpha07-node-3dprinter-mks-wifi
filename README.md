[![npm version](https://badge.fury.io/js/angular2-expandable-list.svg)](https://www.npmjs.com/package/node-3dprinter-mks-wifi)

# node-3dprinter-mks-wifi

> This package allows to manage a 3dPrinter with MKS WIFI support using node.

---

## Prerequisites

This project requires NodeJS (version 16 or later) and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
```

---

## Table of contents

- [node-3dprinter-mks-wifi](#node-3dprinter-mks-wifi)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API](#api)
    - [connect](#connect)
    - [disconnect](#disconnect)
    - [disconnect](#disconnect)
    - [getState](#getstate)
    - [getTemperature](#gettemperature)
    - [getPrintingProgress](#getprintingpprogress)
    - [getPrintingTime](#getprintingtime)
    - [getPrintingFilename](#getprintingfilename)
    - [home](#home)
    - [pause](#pause)
    - [resume](#resume)
    - [abort](#abort)
    - [startFan](#startfan)
    - [stopFan](#stopfan)
    - [setExtruderTemperature](#setextrudertemperature)
    - [setBedTemperature](#setbedtemperature)
  - [Authors](#authors)


---

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

### Via Github

Clone this repo on your local machine:

```sh
$ git clone https://github.com/alealpha07/node-3dprinter-mks-wifi
$ cd node-3dprinter-mks-wifi
```

### Via npm

Install the npm package

```sh
$ npm install node-3dprinter-mks-wifi
```

---

## Usage
To use the package you need to include the `Printer` class in your `index` file first

```js
const Printer = require("node-3dprinter-mks-wifi"); // for npm
//const Printer = require("./printer"); // for github
```

create an instance of the `Printer` by providing the correct `IP` and `PORT`

```js
const Printer = require("node-3dprinter-mks-wifi");
const IP = "192.168.1.1"; //replace with your IP
const PORT = "8080"; //replace with your PORT

const printer = new Printer(IP, PORT);
```

now you can use the functionalities of the printer by simply using the methods listed in the `API` section

### Full Example
This simple example will connect, retrive the printing status and print it to the console.
```js
const Printer = require("node-3dprinter-mks-wifi");
const IP = "192.168.1.1"; //replace with your IP
const PORT = "8080"; //replace with your PORT

const printer = new Printer(IP, PORT);

printer.connect().then(()=>{
   printer.getState().then((result) => {
      console.log(result);
   }).catch((error) => {
      console.log(error);
   }).finally(()=>{
      printer.disconnect();
   })
})

```

With async/await:
```js
const Printer = require("node-3dprinter-mks-wifi");
const IP = "192.168.1.1"; //replace with your IP
const PORT = "8080"; //replace with your PORT

const printer = new Printer(IP, PORT);

async function main(){
   try{
      await printer.connect();
      let result = await printer.getState();
      console.log(result);
   }catch(error){
      console.log(error);
   }
   finally{
      printer.disconnect();
   }
}

main();
```

---

## API

### constructor
constructor
```js
new Printer(ip, port)
```

Supported options for the `constructor` method are listed below.

#### Options

`ip`

| Type | Default value | Mandatory|
| --- | --- | --- |
| string | null | yes |


`port`

| Type | Default value | Mandatory|
| --- | --- | --- |
| string | null | yes |

`minimumExtruderTemperature`

| Type | Default value | Mandatory|
| --- | --- | --- |
| number | 0 | no |

`maximumExtruderTemperature`

| Type | Default value | Mandatory|
| --- | --- | --- |
| number | 280 | no |

`minimumBedTemperature`

| Type | Default value | Mandatory|
| --- | --- | --- |
| number | 0 | no |

`maximumBedTemperature`

| Type | Default value | Mandatory|
| --- | --- | --- |
| number | 100 | no |

---
### connect
connect to the printer
```js
printer.connect()
```

Supported options and possible results for the `connect` method are listed below.

#### Returns
`string` - `Connected to printer at IP:PORT` if succeeded
`string` - `Connection error: ERROR` if failed

#### Options

no option is present

---
### disconnect
disconnect from the printer
```js
printer.disconnect()
```

Supported options and possible results for the `disconnect` method are listed below.

#### Returns
`string` - `Disconnected from printer.` if succeeded
`string` - `Disconnection error: ERROR` if failed

#### Options

no option is present

---
### getState
get status of the printer (printing, idle, pause)
```js
printer.getState()
```

Supported options and possible results for the `getState` method are listed below.

#### Returns
`string` - `STATUS STRING` if succeeded
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### getTemperature
get temperatures of the printer

```js
printer.getTemperature()
```

Supported options and possible results for the `getTemperature` method are listed below.

#### Returns
`object` if succeeded:
```js
{
   nozzleCurrent: number,
   nozzleTarget: number,
   bedCurrent: number,
   bedTarget: number,
   extruder0Current: number,
   extruder0Target: number,
   extruder1Current: number,
   extruder1Target: number,
   heaterPower: number,
   bedHeaterPower: number
}
```
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### getPrintingProgress
get printing progress (percentage)
```js
printer.getPrintingProgress()
```

Supported options and possible results for the `getPrintingProgress` method are listed below.

#### Returns
`number` - between `0` and `100` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### getPrintingTime
get elapsed print time
```js
printer.getPrintingTime()
```

Supported options and possible results for the `getPrintingTime` method are listed below.

#### Returns
`string` - `hh:mm:ss` format if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### getPrintingFilename
get currently in print file name
```js
printer.getPrintingFilename()
```

Supported options and possible results for the `getPrintingFilename` method are listed below.

#### Returns
`string` - `FILENAME.gcode` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### home
bring the hotend to the home position
```js
printer.home()
```

Supported options and possible results for the `home` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### pause
pause the print
```js
printer.pause()
```

Supported options and possible results for the `pause` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### resume
resume the print
```js
printer.resume()
```

Supported options and possible results for the `resume` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### abort
abort the print
```js
printer.abort()
```

Supported options and possible results for the `abort` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

no option is present

---
### startFan
start the fan
```js
printer.startFan()
```

Supported options and possible results for the `startFan` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

`speed`

| Type | Default value | Mandatory| Minimum | Maximum |
| --- | --- | --- | --- | --- |
| number | 255 | no | 0 | 255 |

---
### stopFan
stop the fan
```js
printer.stopFan()
```

Supported options and possible results for the `stopFan` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

---
### setExtruderTemperature
set target extruder temperature
```js
printer.setExtruderTemperature(temperature)
```

Supported options and possible results for the `setExtruderTemperature` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

`temperature`

| Type | Default value | Mandatory| Minimum | Maximum |
| --- | --- | --- | --- | --- |
| number | null | yes | 0| 280|

you can set custom minmum and maximum temperature in the constructor

`extruder`

| Type | Default value | Mandatory| Minimum | Maximum |
| --- | --- | --- | --- | --- |
| number | 0 | no | 0| 1|

you can set the extruder to use (0 for the first one, 1 for the second)

---
### setBedTemperature
set target bed temperature
```js
printer.setBedTemperature(temperature)
```

Supported options and possible results for the `setBedTemperature` method are listed below.

#### Returns
`string` - `ok` if succeeded:
`string` - `Error receiving data: ERROR` if failed

#### Options

`temperature`

| Type | Default value | Mandatory| Minimum | Maximum |
| --- | --- | --- | --- | --- |
| number | null | yes | 0| 100|

you can set custom minmum and maximum temperature in the constructor

---

## Authors

* **Alessandro Prati** - [alealpha07](https://github.com/alealpha07)