"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedule = void 0;
const grammy_1 = require("grammy");
const conversations_1 = require("@grammyjs/conversations");
const keyboards_1 = require("../keyboards");
const logger_1 = require("../utils/logger");
const utils_1 = require("../utils/utils");
const moment_1 = __importDefault(require("moment"));
const ratelimiter_1 = require("@grammyjs/ratelimiter");
const groupRegex = /\w+-\d+/gm;
const setGroup = async (conversation, ctx) => {
    const isKicked = (await ctx.getChatMember(ctx.me.id)).status == "kicked";
    const isAdmin = (await ctx.getAuthor()).status == "administrator" || (await ctx.getAuthor()).status == "creator";
    const isGroup = ctx.chat?.type == "group" || ctx.chat?.type == "supergroup";
    if (isKicked) {
        logger_1.log.error(`Cannot execute ${setGroup.name}: bot is kicked from [${ctx.chat?.id}]`);
        return;
    }
    if (isGroup && !isAdmin) {
        await ctx.reply("Command available for admins only!");
        return;
    }
    await ctx.reply("Введите номер группы (Пример: CS-2129): ");
    ctx = await conversation.waitUnless(grammy_1.Context.has.filterQuery("::bot_command"));
    const group = ctx.message?.text?.match(groupRegex)?.[0];
    ctx.session.schedule = await (0, utils_1.getSchedule)(group ?? "");
    await ctx.reply("Группа установлена!");
    return ctx;
};
const schedule = async (conversation, ctx) => {
    try {
        const isAdmin = (await ctx.getChatMember(ctx.me.id)).status == "administrator";
        if (ctx.session.schedule.length == (0, utils_1.initialSession)().schedule.length) {
            ctx = await setGroup(conversation, ctx) ?? ctx;
        }
        const daySchedule = (0, utils_1.buildSchedule)(ctx.session.schedule[ctx.session.page]);
        if (ctx.message?.message_id != 0 && ctx.session.lastMenu != 0) {
            if (isAdmin) {
                await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            }
            await ctx.api.deleteMessage(ctx.chat.id, ctx.session.lastMenu);
        }
        const sent = await ctx.reply(daySchedule, { reply_markup: keyboards_1.pagesMenu });
        ctx.session.user = ctx.message.from.id;
        ctx.session.lastMenu = sent.message_id;
    }
    catch (err) {
        logger_1.log.error("Failed to parse group!");
        await ctx.reply("Неправильный номер группы!");
    }
};
exports.schedule = schedule;
const composer = new grammy_1.Composer();
composer.use((0, conversations_1.conversations)());
composer.use((0, conversations_1.createConversation)(exports.schedule));
composer.use((0, conversations_1.createConversation)(setGroup));
composer.use((0, ratelimiter_1.limit)({
    timeFrame: 3000,
    limit: 3,
    onLimitExceeded: async (ctx) => {
        await ctx.reply("Слишком много запросов, попробуйте позже 🤒");
    },
    keyGenerator: (ctx) => {
        const chatType = ctx.chat?.type;
        if (chatType == "group" || chatType == "supergroup")
            return ctx.from?.id.toString();
    },
}));
composer.command("schedule", async (ctx) => {
    const kicked = (await ctx.getChatMember(ctx.me.id)).status == "kicked";
    if (kicked) {
        return;
    }
    await ctx.conversation.enter("schedule");
});
composer.command("setgroup", async (ctx) => {
    await ctx.conversation.enter("setGroup");
});
composer.command("now", async (ctx) => {
    moment_1.default.updateLocale("ru", {
        week: {
            dow: 1,
            doy: 7
        }
    });
    if (ctx.session.schedule.length == (0, utils_1.initialSession)().schedule.length) {
        await ctx.conversation.reenter("setGroup");
        return;
    }
    const weekday = (0, moment_1.default)().isoWeekday() - 1;
    if (weekday >= ctx.session.schedule.length) {
        await ctx.reply("🕊️ Сегодня нет пар!");
        return;
    }
    const day = ctx.session.schedule[weekday];
    let nextLesson = null;
    for (const lesson of day) {
        if ((0, moment_1.default)().isBetween((0, moment_1.default)(lesson.startTime, "HH:mm"), (0, moment_1.default)(lesson.endTime, "HH:mm"))) {
            await ctx.reply(`Сейчас 📓 ${lesson.course} в 📍 ${lesson.classroom}`);
            return;
        }
        if ((0, moment_1.default)().isBefore((0, moment_1.default)(lesson.startTime, "HH:mm"))) {
            if ((0, moment_1.default)(lesson.startTime, "HH:mm") < (0, moment_1.default)(nextLesson?.startTime, "HH:mm") || nextLesson == null)
                nextLesson = lesson;
        }
    }
    console.log(nextLesson?.startTime);
    if (nextLesson)
        await ctx.reply(`📓 ${nextLesson.course} ${(0, moment_1.default)(nextLesson.startTime, "HH:mm").fromNow()} в 📍 ${nextLesson.classroom}`);
    else
        await ctx.reply("🎉 Пары закончились!");
});
composer.command("cancel", async (ctx) => {
    await ctx.conversation.exit();
});
exports.default = composer;
