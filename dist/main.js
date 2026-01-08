"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bolt_1 = require("@slack/bolt");
const secrets_1 = require("./utils/secrets");
const spreadsheet_service_1 = __importDefault(require("./services/spreadsheet.service"));
const helpers_1 = require("./utils/helpers");
const user_maps_prod_1 = require("./database/user_maps.prod");
const app = new bolt_1.App({
    token: (0, secrets_1.env)("SLACK_BOT_TOKEN"),
    appToken: (0, secrets_1.env)("SLACK_APP_TOKEN"),
    socketMode: true
});
const sheets = new spreadsheet_service_1.default((0, secrets_1.env)("SPREADSHEET_ID"));
app.event("message", async (data) => {
    try {
        const event = data.event;
        if (event.bot_id)
            return;
        if (!event.text)
            return;
        const time = (0, helpers_1.datetime)(event.ts);
        const sendText = event.text.trim();
        const slackUserID = event.user;
        const user = user_maps_prod_1.userMaps.find(user => user.slackUserID === slackUserID);
        if (sendText.toLowerCase().startsWith("sod:")) {
            const record = {
                ...user,
                day: time.day,
                date: time.datetime,
                sod: time.time,
                eod: null
            };
            await sheets.addStandupRecord(record);
        }
        else if (sendText.toLowerCase().startsWith("eod:")) {
            await sheets.updateEOD(slackUserID, time.time);
        }
    }
    catch (error) {
        console.error(error);
    }
});
(async () => {
    try {
        await app.start();
        console.log(`The App is running`);
    }
    catch (error) {
        console.error(error);
    }
})();
