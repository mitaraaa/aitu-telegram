"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const composer = new grammy_1.Composer();
composer.command("start", async (ctx) => {
    await ctx.reply("👋 Привет! Отправь мне любую слеш-команду из списка и я непременно отвечу 😜");
});
exports.default = composer;
