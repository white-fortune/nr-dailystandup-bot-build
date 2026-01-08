"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = env;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, "../../.env") });
function env(key, default_) {
    const value = process.env[key];
    if (value) {
        return value;
    }
    else {
        if (default_) {
            return default_;
        }
        else {
            throw new Error(`Env key ${key} not found`);
        }
    }
}
