"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandList = void 0;
const grammy_1 = require("grammy");
const start_1 = __importDefault(require("./start"));
const schedule_1 = __importDefault(require("./schedule"));
exports.commandList = [
    {
        command: "schedule",
        description: "Открыть расписание"
    },
    {
        command: "now",
        description: "Показать ближайшую пару"
    },
    {
        command: "setgroup",
        description: "Выбрать группу для получения расписания (только для администраторов!)"
    }
];
const composer = new grammy_1.Composer();
composer.use(start_1.default);
composer.use(schedule_1.default);
exports.default = composer;
