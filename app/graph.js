import {
    me as device
} from "device";

// Screen dimension fallback for older firmware
if (!device.screen) device.screen = {
    width: 348,
    height: 250
};

export default class Graph {

    constructor(id) {

        this._id = id;
        this._xscale = 0;
        this._yscale = 0;
        this._xmin = 0;
        this._xmax = 0;
        this._ymin = 0;
        this._ymax = 0;
        this._pointsize = 2;
        this._direction = "forward"; // or "reverse"

        this._bg = this._id.getElementById("bg");

        this._vals = this._id.getElementsByClassName("gval");

        this._tHigh = 162;
        this._tLow = 72;

        this._tHighLine = this._id.getElementById("tHigh");
        this._tLowLine = this._id.getElementById("tLow");

        this._defaultYmin = 40;
        this._defaultYmax = 400;

    }

    setPosition(x, y) {
        this._id.x = x;
        this._id.y = y;
    }

    setSize(w, h) {
        this._width = w;
        this._height = h;
    }

    setXRange(xmin, xmax) {

        this._xmin = xmin;
        this._xmax = xmax;
        this._xscale = (xmax - xmin) / this._width;
        //console.log("XSCALE: " + this._xscale);

    }

    setYRange(ymin, ymax) {

        this._ymin = ymin;
        this._ymax = ymax;
        this._yscale = (ymax - ymin) / this._id.height;
        //console.log("YSCALE: " + this._yscale);

    }

    getYmin() {
        return this._ymin;
    }

    getYmax() {
        return this._ymax;
    }

    setBGColor(c) {
        this._bgcolor = c;
        this._bg.style.fill = c;
    }

    setHighLimit(l) {
        this._tHigh = l;
        this._tHighLine.style.fill = "red";
    }

    setLowLimit(l) {
        this._tLow = l;
        this._tLowLine.style.fill = "red";
    }

    update(v) {

        //this._bg.style.fill = this._bgcolor;

        if (this._tHigh <= this._ymax && this._tHigh >= this._ymin) {
            this._tHighLine.y1 = this._id.height - ((this._tHigh - this._ymin) / this._yscale);
            this._tHighLine.y2 = this._id.height - ((this._tHigh - this._ymin) / this._yscale);
            this._tHighLine.style.display = "inline";
        }
        if (this._tLow >= this._ymin && this.tLow <= this._ymax) {
            this._tLowLine.y1 = this._id.height - ((this._tLow - this._ymin) / this._yscale);
            this._tLowLine.y2 = this._id.height - ((this._tLow - this._ymin) / this._yscale);
            this._tLowLine.style.display = "inline";
        }
        let firstDate = v[0].date;
        let lastDate = v[v.length - 1].date;
        let xRange = firstDate - lastDate;

        for (var index = 0; index < v.length; index++) {

            let i = v.length - 1 - index;
            this._vals[index].cy = this._id.height - ((v[i].sgv - this._ymin) / this._yscale);
            let diff = v[i].date - lastDate;
            diff = diff / xRange;
            this._vals[index].cx = diff * this._id.width;
            this._vals[index].style.display = "inline";
        }


    }

    reset() {

        for (var index = 0; index < this._vals.length; index++) {
            this._vals[index].style.display = "none";
        }
    }

};