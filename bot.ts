import { config } from "dotenv";
config();

import { Bot, session } from "grammy";

import { run } from "@grammyjs/runner";
import { FileAdapter } from "@grammyjs/storage-file";
import { conversations } from "./conversations";

import { CustomContext, SessionData } from "./types";
import { log } from "./utils/logger";
import { initialSession } from "./utils/utils";

import handlers, { commandList } from "./handlers";
import { pagesMenu } from "./keyboards";

const start = async () => {
    const bot = new Bot<CustomContext>(process.env.TOKEN ?? "");

    bot.use(session({
        initial: initialSession,
        storage: new FileAdapter<SessionData>({
            dirName: "sessions"
        })
    }));

    bot.use(pagesMenu);
    bot.use(conversations());
    bot.use(handlers);

    await bot.api.setMyCommands(commandList);
    log.debug("Loaded commands list");

    const runner = run(bot);
    bot.catch((err) => {
        log.error(err);
    });

    const stopRunner = () => runner.isRunning() && runner.stop();
    process.once("SIGINT", stopRunner);
    process.once("SIGTERM", stopRunner);

    await bot.init();
    log.info(`${bot.botInfo.first_name} - Started!`);
};

start();