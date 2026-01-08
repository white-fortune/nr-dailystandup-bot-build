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
    signingSecret: (0, secrets_1.env)("SLACK_SIGNING_SECRET"),
});
const sheets = new spreadsheet_service_1.default((0, secrets_1.env)("SPREADSHEET_ID"));
app.event("message", async (data) => {
    try {
        const event = data.event;
        const client = data.client;
        if (event.bot_id)
            return;
        if (!event.text)
            return;
        const time = (0, helpers_1.datetime)(event.ts);
        const sendText = event.text.trim();
        const slackUserID = event.user;
        const user = user_maps_prod_1.userMaps.find(user => user.slackUserID === slackUserID);
        const successReaction = (0, secrets_1.env)("SLACK_SUCCESS_REACTION");
        if (sendText.toLowerCase().startsWith("sod")) {
            const record = {
                ...user,
                day: time.day,
                date: time.datetime,
                sod: time.time,
                eod: null,
                sodMessageTimestamp: event.ts
            };
            const response = await sheets.addStandupRecord(record);
            if (!response.ok)
                return;
            if (!response.recorded) {
                const code = response.code;
                switch (code) {
                    case "PENDING_SOD": {
                        const { pendingSODMessageTimestamp } = response;
                        const messagePermalink = await client.chat.getPermalink({
                            channel: event.channel,
                            message_ts: pendingSODMessageTimestamp
                        });
                        if (!messagePermalink.ok)
                            break;
                        await client.chat.postEphemeral({
                            channel: event.channel,
                            user: slackUserID,
                            text: `You already have a pending SOD. Please submit your EOD for that first, then you can start a new SOD. \nHere is the SOD: ${messagePermalink.permalink}`
                        });
                        break;
                    }
                }
                return;
            }
            await client.reactions.add({
                channel: event.channel,
                name: successReaction,
                timestamp: event.ts
            });
        }
        else if (sendText.toLowerCase().startsWith("eod")) {
            const response = await sheets.updateEOD(slackUserID, time.time);
            if (response.ok) {
                await client.reactions.add({
                    channel: event.channel,
                    name: successReaction,
                    timestamp: event.ts
                });
            }
        }
    }
    catch (error) {
        console.error(error);
    }
});
(async () => {
    try {
        await app.start(5000);
        console.log(`The App is running on port 5000`);
    }
    catch (error) {
        console.error(error);
    }
})();
