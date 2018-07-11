// Import the messaging module
import * as messaging from "messaging";
import {
    encode
} from 'cbor';
import {
    outbox
} from "file-transfer";
import {
    settingsStorage
} from "settings";
import {
    me
} from "companion";
import {
    geolocation
} from "geolocation";
import * as util from "../common/utils";


// // default URL pointing at xDrip Plus endpoint
var baseURL = "";
//WeatheyAPI connection
var API_KEY = null;
var ENDPOINT = null


if (me.launchReasons.peerAppLaunched) {
    // The Device application caused the Companion to start
    console.log("Device application was launched!");
}

if (me.launchReasons.wokenUp) {
    // The companion started due to a periodic timer
    console.log("Started due to wake interval!")
    formatReturnData(); // just to make sure
}


var lastbg;
var lastdate;
var lastperiod;
var lastdelta;
var bgNext;
let BGLow = 0;
let BGHigh = 0;
let BGDiff = 0;
let longPeriod = 0;
let longDiff = 0;
let units = "bg/dl"; // init.
var podChange;
let minUpdate = 0;
let timerVal = 0; // default to no timer
let cometDays = 3;
let cometHours = 12;
var cometURL;

function sendData(bg, date, period, delta, next, calibration) {
    console.log("Replying from companion");
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        let now = new Date();
        console.log(`bg=${bg} age=${(now.getTime()-date)/(60*1000)} mins`);
        messaging.peerSocket.send({
            key: "bg",
            bg: bg,
            date: date,
            period: period,
            delta: delta,
            update: next,
            calibration: calibration
        });

    } else {
        console.log("********* No peerSocket connection");
    }
}


let doingFetch = false; // Try to avoid overlapping fetches
function queryBGD() {
    if (baseURL == "") return;
    let url = getSgvURL()
    let now = new Date();

    console.log(url);

    // Save a flag saying we're now looking for the information needed
    // Don't initiate another query when we already have one going
    if (doingFetch) {
        console.log("Disallowing multiple overlapping fetches");
        return; // Don't allow multiple overlapping fetches
    }
    doingFetch = true;

    return fetch(url)
        .then(function(response) {
            return response.json()
                .then(function(data) {
                    console.log(`Got data: ${data}`);
                    // Calculate how long between updates
                    let a = data[0].date;
                    let b = data[1].date;
                    lastperiod = a - b;

                    let calibration = false;
                    // Save away the last info
                    if (data[0].type == "cal") {
                        calibration = true;
                        lastbg = data[1].sgv;
                        lastdate = data[1].date;
                    } else {
                        lastbg = data[0].sgv;
                        lastdate = data[0].date;
                        if (data[1].type == "cal") {
                            calibration = true;
                        }
                    }
                    if (calibration) {
                        lastdelta = 0;
                    } else {
                        lastdelta = data[0].sgv - data[1].sgv;
                    }
                    bgNext = setUpdateInterval();
                    sendData(lastbg, lastdate, lastperiod, lastdelta, bgNext, calibration);
                    doingFetch = false;
                });
        })
        .catch(function(err) {
            console.log("Error fetching " + err);
            // Try again in 1 minute
            sendData(0, 0, 0, 0, now.getTime() + (1 * 60 * 1000), false);
            doingFetch = false;
        });
}


function returnGraphData(data) {
    const myFileInfo = encode(data);
    outbox.enqueue('graph.json', myFileInfo);
}

function sendGraphData(data) {

    let graphData = [];

    for (let i = 0; i < data.length; i++) {
        graphData[i] = {
            sgv: data[i].sgv,
            date: data[i].date
        };
    }

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log(`Sending graph data... `);
        messaging.peerSocket.send({
            key: "graphdata",
            data: graphData
        });
    } else {
        console.log("No peerSocket connection");
    }

    gettingGraphData = false; // done
}


let gettingGraphData = false;

function getGraphData() {
    if (gettingGraphData) return; // Don't do this twice overlapping
    gettingGraphData = true;

    let url = getGraphURL()
    let now = new Date();

    console.log(url);

    return fetch(url)
        .then(function(response) {
            return response.json()
                .then(function(data) {
                    //        returnGraphData(data);
                    sendGraphData(data);
                });
        })
        .catch(function(err) {
            console.log("Error fetching " + err);
            gettingGraphData = false; // error, so we're done
        });
}



// Send the weather data to the device
function returnData(data) {
    const myFileInfo = encode(data);
    outbox.enqueue('file.txt', myFileInfo)

}

function formatReturnData() {
    console.log("formatReturnData");
    queryBGD();
}

function formatUpdateData() {
    console.log("formatUpdateData");
    sendData(lastbg, lastdate, lastperiod, lastdelta, bgNext, false);
}


// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
    console.log(`********** Companion received message: ${evt.data.command}`);
    sendSetting("ack", 0, ""); // ack the request
    switch (evt.data.command) {
        case "data":
            formatReturnData(); // Actually gather the data now
            break;

        case "update":
            formatUpdateData(); // Just send me the last data
            break;

        case "podchange":
            getAndSendPodchange();
            break;

        case "graph":
            getGraphData();
            break;
    }
}

function getAndSendPodchange() {

    podChange = settingsStorage.getItem("podchange");
    console.log(`new podchange time is ${podChange}`);
    if (typeof podChange !== "undefined" && podChange) {

        let d = new Date(parseInt(podChange));
        settingsStorage.setItem("changeDate", JSON.stringify({
            "name": d.toLocaleString()
        }));
    } else {
        settingsStorage.setItem("changeDate", JSON.stringify({
            "name": ""
        }));
    }

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log("Sending podchange data...");
        messaging.peerSocket.send({
            key: "podchange",
            value: podChange,
            period: cometDays,
            before: cometHours
        });
    } else {
        console.log("No peerSocket connection");
    }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
    // Handle any errors
    console.log("********** Connection error: " + err.code + " - " + err.message);
}


//----------------------------------------------------------
//
// This section deals with settings
//
//----------------------------------------------------------

/*
function getHourMin(name, newTime) {
    console.log("Trying");
    let d = new Date();
    let ds = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();
    let newd = new Date(ds + " " + newTime);

    d = {
        hour: newd.getHours(),
        min: newd.getMinutes()
    };

    if (d.hour >= 0 && d.min >= 0) {
        return d;
    } else {
        settingsStorage.setItem(name, JSON.stringify({
            name: "HH:MM"
        }));
        console.log("error in time");
        return {
            hour: -1,
            min: -1
        };
    }
}
*/

/*
 * Format a date according to my described format from the settings page
 */
function datestring(rem) {
    var mon = rem.getMonth() + 1;
    var day = rem.getDate();
    var year = rem.getFullYear();
    var hour = rem.getHours();
    var med = "AM";
    var hourint = parseInt(hour);
    if (hourint > 12) {
        hourint -= 12;
        med = 'PM';
    } else if (hourint === 12) {
        med = 'PM';
    } else if (hourint === 0) {
        hourint = 12;
    }
    hour = hourint.toString();

    var min = rem.getMinutes();

    var ts = mon + "/" + day + "/" + year + "%20" + hour + ":" + min + ":00%20" + med + "%20-0000";

    return (ts);
}


// Fetch a URL constructed from the one given in the configuration
// and substituting "<c>" with the comet reset date and time
// Uses format: MM/DD/YYYY HH:MM:SS "AM"|"PM" <TZ-offset>
// which should work if dropped directly back into javascript Date()
function addURL(now) {

    if (typeof(cometURL) == "undefined" ||
        cometURL == "") {
        return;
    }

    console.log(`addURL: ${cometURL}`);

    var tzoffset = now.getTimezoneOffset() * 1000 * 60;

    var nowgmt = new Date(now.getTime() + tzoffset);
    var ts = datestring(nowgmt);

    var comet = ts;

    var url = (' ' + cometURL).slice(1); // force copy of the string

    var newURL = url.replace("<c>", comet);

    console.log('Opening Comet URL: ' + newURL);

    return fetch(newURL)
        .then(function(response) {
            return response.text()
                .then(function(data) {
                    console.log(data);
                })
        });
}


settingsStorage.onchange = function(evt) {
    var d;
    var minUpdateStr;

    console.log(`Got settings storage change ${evt.key}`);
    switch (evt.key) {
        case "change": // Update calendar of a pod change
            console.log("Change pod now");
            //            let toggleValue = settingsStorage.getItem("change");
            //            if (toggleValue === 'true') {
            console.log("Updating comet");
            d = new Date();
            settingsStorage.setItem("podchange", d.getTime());
            if (!isNaN(timerVal) && timerVal != 0) {
                sendSetting("timer", timerVal, "");
            }
            // Invoke our special URL for this update
            addURL(d);
            getAndSendPodchange();
            //            }
            break;

        case "changeDate":
            d = JSON.parse(evt.newValue);
            console.log(`d=${d.name}`);
            d = new Date(d.name);
            if (isNaN(d.getTime())) {
                settingsStorage.removeItem("changeDate");
            }
            settingsStorage.setItem("podchange", d.getTime());
            getAndSendPodchange();
            break;

        case "minUpdate":
            console.log(`evt=${JSON.parse(evt.newValue)}`);
            minUpdate = JSON.parse(evt.newValue);
            minUpdateStr = minUpdate.name;
            minUpdate = parseInt(minUpdateStr);
            if (isNaN(minUpdate)) {
                settingsStorage.removeItem("minUpdate");
            }
            break;

        case "timer":
            timerVal = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(timerVal)) {
                settingsStorage.removeItem("timerVal");
            }
            console.log(`Timer set to ${timerVal}`);
            break;

        case "low":
            BGLow = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(BGLow)) {
                settingsStorage.removeItem("BGLow");
            }
            console.log(`Low limit set to ${BGLow}`);
            sendLowHigh();
            break;

        case "high":
            BGHigh = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(BGHigh)) {
                settingsStorage.removeItem("BGHigh");
            }
            console.log(`High limit set to ${BGHigh}`);
            sendLowHigh();
            break;

        case "diff":
            BGDiff = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(BGDiff)) {
                settingsStorage.removeItem("BGDiff");
            }
            console.log(`BG Difference set to ${BGDiff}`);
            sendLowHigh();
            break;

        case "longDiff":
            longDiff = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(longDiff)) {
                settingsStorage.removeItem("longDiff");
            }
            console.log(`Long period difference set to ${longDiff}`);
            sendLongInfo();
            break;

        case "longPeriod":
            longPeriod = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(longPeriod)) {
                settingsStorage.removeItem("longPeriod");
            }
            console.log(`Long period set to ${longPeriod} mins`);
            sendLongInfo();
            break;

        case "warn-start":
            try {
                let w = JSON.parse(evt.newValue).name;
                sendSetting("warn-start", 0, w);
            } catch (err) {
                settingsStorage.removeItem("warn-start");
            }
            break;

        case "warn-end":
            try {
                let w = JSON.parse(evt.newValue).name;
                sendSetting("warn-end", 0, w);
            } catch (err) {
                settingsStorage.removeItem("warn-end");
            }
            break;

        case "bgsnooze0":
        case "bgsnooze1":
        case "bgsnooze2":
        case "bgsnooze3":
        case "bgsnooze4":
        case "bgsnooze5":
        case "bgsnooze6":
        case "bgsnooze7":
            let bgSnooze = JSON.parse(evt.newValue);
            try {
                let index = evt.key.slice(-1);
                BGSnooze[index] = parseInt(JSON.parse(evt.newValue).name);
                sendSetting("bgsnooze", index, JSON.parse(evt.newValue).name);
            } catch (err) {
                settingsStorage.setItem("bgsnooze" + index.toString(), BGSnooze[index].toString());
            }
            break;

        case "url":
            baseURL = JSON.parse(evt.newValue).name;
            if (baseURL != "") {
                baseURL = baseURL.trim();
                baseURL = baseURL.replace(/\/$/, "");
                settingsStorage.setItem("url", JSON.stringify({
                    "name": baseURL
                }));
                sendSetting("ns", 1, "");
                //        queryBGD();
            } else {
                sendSetting("ns", 0, "");
            }
            break;

        case "units":
            let toggleValue = settingsStorage.getItem("units");
            units = (toggleValue === 'false') ? "bg/dl" : "mmol/L";
            sendSetting("units", 0, units);
            console.log(`New Units of ${units}`);
            break;

        case "cometURL":
            cometURL = JSON.parse(evt.newValue).name;
            break;

        case "cometDays":
            cometDays = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(cometDays)) {
                settingsStorage.removeItem("cometDays");
            }
            break;

        case "comethours":
            cometHours = parseInt(JSON.parse(evt.newValue).name);
            if (isNaN(cometHours)) {
                settingsStorage.removeItem("cometHours");
            }
            break;

        case "bgFont1":
            let size = parseInt(JSON.parse(evt.newValue).name);
            if (!isNaN(size)) {
                settingsStorage.removeItem("bgFont1");
            }
            settingsStorage.setItem("bgFont1", evt.newValue);
            sendSetting("bgFont1", size, "");
            break;

        case "alarm0":
        case "alarm1":
        case "alarm2":
        case "alarm3":
        case "alarm4":
        case "alarm5":
        case "alarm6":
        case "alarm7":
        case "alarm8":
        case "alarm9":
            let alarmTime = JSON.parse(evt.newValue);
            sendSetting("alarm", parseInt(evt.key.slice(-1)), alarmTime.name);
            break;

        case "mess0":
        case "mess1":
        case "mess2":
        case "mess3":
        case "mess4":
        case "mess5":
        case "mess6":
        case "mess7":
        case "mess8":
        case "mess9":
            let mess = JSON.parse(evt.newValue);
            sendSetting("mess", parseInt(evt.key.slice(-1)), mess.name);
            break;

        case "alarmsnooze0":
        case "alarmsnooze1":
        case "alarmsnooze2":
        case "alarmsnooze3":
        case "alarmsnooze4":
        case "alarmsnooze5":
        case "alarmsnooze6":
        case "alarmsnooze7":
            console.log("alarmsnoozetimes");
            try {
                let index = parseInt(evt.key.slice(-1));
                alarmSnooze[index] = parseInt(JSON.parse(evt.newValue).name);
                sendSetting("alarmsnooze", index, JSON.parse(evt.newValue).name);
            } catch (err) {
                console.log(`err = ${err}`);
                settingsStorage.setItem("alarmsnooze" + index.toString(), alarmSnooze[index].toString());
            }
            break;

        case "gradient":
            gradientColor = JSON.parse(evt.newValue).name;
            sendSetting("gradient", 0, gradientColor);
            break;

        case "hour":
            hourColor = JSON.parse(evt.newValue).name;
            sendSetting("hour", 0, hourColor);
            break;

        case "minute":
            minuteColor = JSON.parse(evt.newValue).name;
            sendSetting("minute", 0, minuteColor);
            break;

        case "second":
            secondColor = JSON.parse(evt.newValue).name;
            sendSetting("second", 0, secondColor);
            break;

    }
}

function sendSetting(item, num, value) {
    console.log(`sendsetting ${item},${num},${value}`);
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log(`Sending settings data... key=${item}, num=${num}, value=${value}`);
        messaging.peerSocket.send({
            key: item,
            number: num,
            value: value
        });
    } else {
        console.log("No peerSocket connection");
    }
}

// getters 
function getSettings(key) {
    if (settingsStorage.getItem(key)) {
        return JSON.parse(settingsStorage.getItem(key));
    } else {
        return undefined
    }
}

function getSgvURL() {

    return (baseURL + "/api/v1/entries.json?count=2");
}

function getGraphURL() {

    return (baseURL + "/api/v1/entries/sgv.json?count=24");
}



let fetchTimeoutHandle = 0;
let fetchTimeoutTime = 0;
let wakeups = 0; // count of number of wakeups we currently have waiting
let interval = 0; // init.

function setUpdateInterval() {
    var period;

    if (lastdate > 0 && lastperiod > 0) {
        // Calculate next update
        let now = new Date();

        //    if (minUpdate > 0) {
        //      period = minUpdate * 60 * 1000; // in milliseconds
        //    } else {
        period = lastperiod;
        //    }

        //    bgNext = lastdate - now.getTime() + period;
        console.log(`Update period is ${period/(60*1000)} mins`);
        for (bgNext = lastdate + period; bgNext < now.getTime() + (util.Min2ms(minUpdate)); bgNext += period) {
            let y = (bgNext - now.getTime()) / (60 * 1000);
            console.log(`bgNext moves to ${y} mins in future`);
        }
        let y = (bgNext - now.getTime()) / (60 * 1000);
        console.log(`bgNext positioned at ${y} mins in future`);

        /*
            // Let's increase the update interval to double the interval
            if (minUpdate && bgNext < now.getTime() + (minUpdate * 60 * 1000)) {
              bgNext = now.getTime() + minUpdate * 60 * 1000;      
            }
        */
        bgNext += 10 * 1000; // and add 10 sec's to avoid race conditions
        let m = (bgNext - now.getTime()) / 60000;

        console.log(`Need wakeup in ${m} mins`);
        if (BGLow || BGHigh) {
            if (fetchTimeoutHandle) {
                console.log(`>>>> Clearing wakeup from ${now.getTime()-fetchTimeoutTime} msec's ago which didn't happen`);
                clearTimeout(fetchTimeoutHandle);
            }
        }
        return bgNext; // need a wakeup at this time
    }
}

function sendSnoozeTimes() {
    console.log("Sending snooze times");

    for (let i = 0; i < 8; i++) {
        sendSetting("alarmsnooze", i, alarmSnooze[i].toString());
        sendSetting("bgsnooze", i, BGSnooze[i].toString());
    }
}

function sendLowHigh() {

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({
            key: "limits",
            low: BGLow,
            high: BGHigh,
            diff: BGDiff
        });
    } else {
        console.log("No peerSocket connection");
    }
}

function sendLongInfo() {

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({
            key: "long",
            period: longPeriod,
            diff: longDiff
        });
    } else {
        console.log("No peerSocket connection");
    }
}

function sendBGFontSize() {
    var size;
    try {
        size = parseInt(JSON.parse(settingsStorage.getItem("bgFont1")).name);
    } catch (err) { // Set a default
        settingsStorage.setItem("bgFont1", JSON.stringify({
            "name": "30"
        }));
        size = 30;
    }

    sendSetting("bgFont1", size, "");
}

function sendConfiguration() {

    //  getAndSendPodchange();
    sendBGFontSize();
    sendLowHigh();
    sendLongInfo();
    sendSetting("units", 0, units);
    if (baseURL == "") {
        console.log("ns false");
        sendSetting("ns", 0, "");
    } else {
        console.log("ns true");
        sendSetting("ns", 1, "");
    }
    getAndSendPodchange();
    if (typeof(warnStart) != "undefined")
        sendSetting("warn-start", 0, warnStart);
    if (typeof(warnEnd) != "undefined")
        sendSetting("warn-end", 0, warnEnd);
    sendSetting("gradient", 0, gradientColor);
    sendSetting("hour", 0, hourColor);
    sendSetting("minute", 0, minuteColor);
    sendSetting("second", 0, secondColor);
    //  sendSnoozeTimes();
}

messaging.peerSocket.onopen = evt => {

    console.log("Companion is ready");
    sendConfiguration();
    //  formatReturnData();
}


function onWakeup(companion, event) {
    console.log("wakeup here!");
    //    wakeups--;
    //  fetchTimeoutHandle = 0; // got it!
    //  fetchTimeoutTime = 0;
    formatReturnData();
}

// Init.
settingsStorage.setItem("change", 'false');
try {
    let minUpdateStr = JSON.parse(settingsStorage.getItem("minUpdate"));
    console.log(`C: minUpdateStr = ${minUpdateStr}`);
    minUpdate = parseInt(minUpdateStr.name);
    console.log(`C: minUpdate is ${minUpdate}`);
} catch (err) {
    settingsStorage.setItem("minUpdate", JSON.stringify({
        "name": "2"
    }));
}

try {
    let podchange = settingsStorage.getItem("podchange");
    console.log(`podchange time as read is ${podchange}`);
    let i = parseInt(podChange);
    if (i > 0) {
        let d = new Date(parseInt(podchange));
        settingsStorage.setItem("changeDate", JSON.stringify({
            "name": d.toLocaleString()
        }));
    } else {
        console.log("podchange is not postive");
        podChange = 0;
        settingsStorage.setItem("changeDate", JSON.stringify({
            "name": ""
        }));
    }
} catch (err) {
    console.log("error in podchange - init'ing");
    podChange = 0;
    settingsStorage.setItem("changeDate", JSON.stringify({
        "name": ""
    }));
}

console.log("at timer");
try {
    timerVal = parseInt(JSON.parse(settingsStorage.getItem("timer")).name);
} catch (err) {
    settingsStorage.setItem("timer", JSON.stringify({
        "name": "0"
    }));
}

console.log("at bglow");
try {
    BGLow = parseInt(JSON.parse(settingsStorage.getItem("low")).name);
    console.log(`BGLow=${BGLow}`);
} catch (err) {
    BGLow = 0;
}

console.log("at bghigh");
try {
    BGHigh = parseInt(JSON.parse(settingsStorage.getItem("high")).name);
    console.log(`BGHigh=${BGHigh}`);
} catch (err) {
    BGHigh = 0;
}

console.log("at bgdiff");
try {
    BGDiff = parseInt(JSON.parse(settingsStorage.getItem("diff")).name);
    console.log(`BGDiff=${BGDiff}`);
} catch (err) {}

try {
    longPeriod = parseInt(JSON.parse(settingsStorage.getItem("longPeriod")).name);
    console.log(`longPeriod=${longPeriod} mins`);
} catch (err) {
    longPeriod = 0;
}

try {
    longDiff = parseInt(JSON.parse(settingsStorage.getItem("longDiff")).name);
    console.log(`longDiff=${longDiff}`);
} catch (err) {
    longDiff = 0;
}

console.log("at url");
try {
    baseURL = JSON.parse(settingsStorage.getItem("url")).name;
    if (baseURL != "") {
        baseURL = baseURL.trim();
        baseURL = baseURL.replace(/\/$/, "");
    }
} catch (err) {
    settingsStorage.setItem("url", JSON.stringify({
        "name": ""
    }));
    baseURL = "";
}

console.log("at comet days");
try {
    cometDays = parseInt(JSON.parse(settingsStorage.getItem("cometDays")).name);
} catch (err) {
    settingsStorage.setItem("cometDays", JSON.stringify({
        "name": "3"
    }));
    cometDays = 3;
}

console.log("at comet hours");
try {
    cometHours = parseInt(JSON.parse(settingsStorage.getItem("cometHours")).name);
} catch (err) {
    settingsStorage.setItem("cometHours", JSON.stringify({
        "name": "12"
    }));
    cometHours = 12;
}

console.log("at comet url");
try {
    cometURL = JSON.parse(settingsStorage.getItem("cometURL")).name;
} catch (err) {}

console.log("at alarm snooze times");
let alarmSnooze = [10, 20, 30, 40, 50, 60, 90, 120];
for (let i = 0; i < 8; i++) {
    try {
        let as = JSON.parse(settingsStorage.getItem("alarmsnooze" + i.toString()));
        if (as > 0) {
            alarmSnooze[i] = as;
        } else {
            settingsStorage.setItem("alarmsnooze" + i.toString(), JSON.stringify({
                "name": alarmSnooze[i].toString()
            }));
        }
    } catch (err) {}
}

console.log("at bgsnooze times");
let BGSnooze = [20, 40, 60, 90, 120, 180, 240, 480];
for (let i = 0; i < 8; i++) {
    try {
        let bgs = JSON.parse(settingsStorage.getItem("bgsnooze" + i.toString()));
        if (bgs > 0) {
            BGSnooze[i] = bgs;
        } else {
            settingsStorage.setItem("bgsnooze" + i.toString(), JSON.stringify({
                "name": BGSnooze[i].toString()
            }));
        }
    } catch (err) {}
}

console.log("at units");
let toggleValue = settingsStorage.getItem("units");
units = (toggleValue === 'true') ? "mmol/L" : "bg/dl";
console.log(`Got initial value of units as ${units}`);

console.log("at warnstart");
var warnStart;
try {
    warnStart = JSON.parse(settingsStorage.getItem("warn-start")).name;
} catch (err) {
    warnStart = "";
}

console.log("at warnend");
var warnEnd;
try {
    warnEnd = JSON.parse(settingsStorage.getItem("warn-end")).name;
} catch (err) {
    warnEnd = "";
}

console.log("at gradient color");
var gradientColor;
try {
    gradientColor = JSON.parse(settingsStorage.getItem("gradient")).name;
} catch (err) {}
if (typeof gradientColor == "undefined" || gradientColor == "")
    gradientColor = "blue";

var hourColor;
try {
    hourColor = JSON.parse(settingsStorage.getItem("hour")).name;
} catch (err) {}
console.log(`hourColor = {$hourColor}`);
if (!hourColor)
    hourColor = "white";

var minuteColor;
try {
    minuteColor = JSON.parse(settingsStorage.getItem("minute")).name;
} catch (err) {}
if (!minuteColor)
    minuteColor = "white";

var secondColor;
try {
    secondColor = JSON.parse(settingsStorage.getItem("second")).name;
} catch (err) {}
if (!secondColor)
    secondColor = "red";

console.log("All other initialization depends upon comm channel coming up.");
//me.onWakeInterval = () => onWakeup();
//me.wakeInterval = 10 * 60 * 1000;

//setInterval(onWakeup, 5 * 60 * 1000); // Update every 5 minutes