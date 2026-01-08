"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datetime = datetime;
const secrets_1 = require("./secrets");
/**
* @param {number | string} ts
* @description returns **datetime** in **mm/dd/yyyy** format, **time** in **HH:MM:SS AM/PM**
*/
function datetime(ts) {
    const datetime = new Date(Number(ts) * 1000);
    const timestampHourShift = (0, secrets_1.env)("TIMESTAMP_HOUR_SHIFT", "0");
    if (timestampHourShift) {
        datetime.setHours(datetime.getHours() + Number(timestampHourShift));
    }
    return {
        datetime: datetime.toLocaleDateString(),
        day: datetime.toLocaleDateString("en-US", { weekday: "long" }),
        time: datetime.toLocaleTimeString()
    };
}
