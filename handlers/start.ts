import { Composer } from "grammy";
import { CustomContext } from "../types";

const composer = new Composer<CustomContext>();

composer.command("start", async (ctx) => {
    await ctx.reply("👋 Привет! Отправь мне любую слеш-команду из списка и я непременно отвечу 😜");
});

export default composer;