"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const grammy_1 = require("grammy");
const runner_1 = require("@grammyjs/runner");
const storage_file_1 = require("@grammyjs/storage-file");
const conversations_1 = require("@grammyjs/conversations");
const logger_1 = require("./utils/logger");
const utils_1 = require("./utils/utils");
const handlers_1 = __importStar(require("./handlers"));
const keyboards_1 = require("./keyboards");
const bot = new grammy_1.Bot(process.env.TOKEN ?? "");
bot.use((0, grammy_1.session)({
    initial: utils_1.initialSession,
    storage: new storage_file_1.FileAdapter({
        dirName: "tmp/sessions"
    })
}));
bot.use(keyboards_1.pagesMenu);
bot.use((0, conversations_1.conversations)());
bot.use(handlers_1.default);
bot.api.setMyCommands(handlers_1.commandList);
const runner = (0, runner_1.run)(bot);
bot.catch((err) => {
    logger_1.log.error(err);
});
const stopRunner = () => runner.isRunning() && runner.stop();
process.once("SIGINT", stopRunner);
process.once("SIGTERM", stopRunner);
exports.default = bot;
