---
description: "Complete SystemInspector documentation and API reference for Statsfunctions. Retrieve detailed hardware and system telemetry in Node.js."
---

# Stats Functions

## Getting correct stats values

In fsStats(), disksIO(), currentLoad() and networkStats() the results / sec. values (rx\_sec, IOPS, ...) are calculated correctly beginning with the **second** call of the function. It is determined by calculating the difference of transferred bytes / IOs divided by the time between two calls of the function.

The first time you are calling one of this functions, you will get null for transfer rates. The second time, you should then get statistics based on the time between the two calls ...

Calls made less than 500 ms apart may return cached rate values. Use a steady interval, such as one second, for monitoring dashboards.

So basically, if you e.g. need a values for network stats every second, your code should look like this:

```
const si = require('systeminspector');

setInterval(function() {
    si.networkStats().then(data => {
        console.log(data);
    })
}, 1000)
```

Beginning with the second call, you get network transfer values per second.

## Observe System Parameters

systeminspector now allows you to easily observe system parameters: First you define a result object of system parameters you want to observe (see also decription of the [si.get() function here](general.html)):

Then you just call an si.observe() function with three parameters: your result object, the polling interval (in milliseconds) and a callback function. systeminspector will now observe the result object. Every time the result changes, your callback function is called. This callback function also gets the current value the observed system parameters object.

| Function | Result object | Linux | BSD | Mac | Win | Sun | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| si.observe(valueObject,interval,cb) | \- | X | X | X | X | X | Observe the defined value object,  
call callback on changes: |

The key names of the valueObject must be exactly the same as the representing function in systeminspector.

## Examples

##### Example

```
const si = require('systeminspector');

// define all values, you want to get back
valueObject = {
  battery: 'acconnected'
}

function usersCallback(data) {
  console.log('Power usage now: ' + (data.battery.acconnected ? 'AC' : 'battery'));
}

// now define the observer function
let observer = si.observe(valueObject, 1000, usersCallback);

// In this example we stop our observer function after 30 seconds
setTimeout(() => {
  clearInterval(observer)
}, 30000);
```

