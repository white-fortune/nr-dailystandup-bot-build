"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datetime = datetime;
/**
* @param {number | string} ts
* @description returns **datetime** in **mm/dd/yyyy** format, **time** in **HH:MM:SS AM/PM**
*/
function datetime(ts) {
    const datetime = new Date(Number(ts) * 1000);
    return {
        datetime: datetime.toLocaleDateString(),
        day: datetime.toLocaleDateString("en-US", { weekday: "long" }),
        time: datetime.toLocaleTimeString()
    };
}
