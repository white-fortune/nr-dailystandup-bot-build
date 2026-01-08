"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
const path_1 = require("path");
class SpreadSheetService {
    constructor(spreadsheetId) {
        this.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
        this.serviceAccountKey = (0, path_1.join)(__dirname, '../../credentials', 'service_account.json');
        this.auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: this.serviceAccountKey,
            scopes: this.scopes
        });
        this.sheets = googleapis_1.google.sheets({
            version: 'v4',
            auth: this.auth
        });
        this.spreadsheetId = spreadsheetId;
    }
    /**
    * @param {TStandupRecord} record - record sequence: `slackUserID`, `personalID`, `name`, `day`, `date`, `sod`, `eod`
    * @description Adds a **empty-eod standup record in standups sheet** and also adds a **pending eod record in pendings sheet**
    */
    async addStandupRecord(record) {
        try {
            const lastPendingSODResponse = await this.getLastPendingSOD(record.slackUserID);
            if (!lastPendingSODResponse.ok)
                return { ok: false };
            const lastOpenedSODMessageTs = lastPendingSODResponse.sodMessageTimestamp;
            if (lastOpenedSODMessageTs) {
                return { ok: true, recorded: false, code: "PENDING_SOD", pendingSODMessageTimestamp: lastOpenedSODMessageTs };
            }
            //NOTE: Adding the standup record in the main standups sheet
            const addedRow = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: "standups!A3:F",
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                requestBody: {
                    values: [Object.values({ ...record, sodMessageTimestamp: "" })]
                }
            });
            const updatedRange = addedRow.data.updates?.updatedRange;
            const pendingRecord = {
                slackUserID: record.slackUserID,
                personalID: record.personalID,
                lastOpenedSODRange: updatedRange,
                sodMessageTimestamp: record.sodMessageTimestamp
            };
            //NOTE: Adding a pending EOD record in pendings sheet
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: "pendings!A4:C",
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                requestBody: {
                    values: [Object.values(pendingRecord)]
                }
            });
            return { ok: true, recorded: true };
        }
        catch (error) {
            console.error(error);
            return { ok: false };
        }
    }
    /**
    * @description Updates the EOD and deletes the pending record
    */
    async updateEOD(slackUserID, eodValue) {
        try {
            //NOTE: Getting the pendings records from pendings sheets
            const pendingRecord = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: "pendings!A4:C"
            });
            const values = pendingRecord.data.values;
            if (!values)
                return { ok: false };
            //NOTE: Getting the pending records of the user with slackUserID
            const records = values.filter(value => value[0] === slackUserID);
            //NOTE: Getting the last pending record as assuming its always the case that there will always be one pending eod record of a specific user at a time
            const record = records[records.length - 1];
            //NOTE: Getting the row number in which the standup record is saved as pendings saves the whole range. Then updating the EOD date of that standup record
            const sodRange = record[2];
            const eodRowMatch = sodRange.match(/\d+/);
            const eodRow = Number(eodRowMatch[0]);
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `standups!G${eodRow}`,
                valueInputOption: "RAW",
                requestBody: {
                    values: [[eodValue]]
                }
            });
            //NOTE: +4 cause actual record saves from A4 and not A1. Then deleting the record
            const pendingRecordRow = values.findIndex(value => value[0] === slackUserID) + 4;
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: `pendings!A${pendingRecordRow}:D${pendingRecordRow}`,
            });
            return { ok: true };
        }
        catch (error) {
            console.error(error);
            return { ok: false };
        }
    }
    async getLastPendingSOD(slackUserID) {
        try {
            const pendingRecord = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: "pendings!A4:D"
            });
            const values = pendingRecord.data.values;
            if (!values)
                return { ok: true };
            //NOTE: Getting the pending records of the user with slackUserID
            const records = values.filter(value => value[0] === slackUserID);
            if (records.length === 0) {
                return { ok: true };
            }
            //NOTE: Getting the last pending record as assuming its always the case that there will always be one pending eod record of a specific user at a time
            const record = records[records.length - 1];
            const sodMessageTimestamp = record[3];
            return { ok: true, sodMessageTimestamp };
        }
        catch (error) {
            console.error(error);
            return { ok: false };
        }
    }
}
exports.default = SpreadSheetService;
