import { Composer, Context } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import { pagesMenu } from "../keyboards";
import { CustomContext, CustomConversation, Lesson } from "../types";
import { log } from "../utils/logger";
import { getSchedule, buildSchedule, initialSession } from "../utils/utils";
import moment from "moment";
import { limit } from "@grammyjs/ratelimiter";


const groupRegex = /\w+-\d+/gm;

const setGroup = async (conversation: CustomConversation, ctx: CustomContext) => {
    const isKicked = (await ctx.getChatMember(ctx.me.id)).status == "kicked";
    const isAdmin = (await ctx.getAuthor()).status == "administrator" || (await ctx.getAuthor()).status == "creator";
    const isGroup = ctx.chat?.type == "group" || ctx.chat?.type == "supergroup";

    if (isKicked) {
        log.error(`Cannot execute ${setGroup.name}: bot is kicked from [${ctx.chat?.id}]`);
        return;
    }

    if (isGroup && !isAdmin) {
        await ctx.reply("Command available for admins only!");
        return;
    }

    await ctx.reply("Введите номер группы (Пример: CS-2129): ");
    ctx = await conversation.waitUnless(Context.has.filterQuery("::bot_command"));
    const group = ctx.message?.text?.match(groupRegex)?.[0];
    ctx.session.schedule = await getSchedule(group ?? "");
    await ctx.reply("Группа установлена!");

    return ctx;
};

export const schedule = async (conversation: CustomConversation, ctx: CustomContext) => {
    try {
        const isAdmin = (await ctx.getChatMember(ctx.me.id)).status == "administrator";

        if (ctx.session.schedule.length == initialSession().schedule.length) {
            ctx = await setGroup(conversation, ctx) ?? ctx;
        }

        const daySchedule = buildSchedule(ctx.session.schedule[ctx.session.page]);

        if (ctx.message?.message_id != 0 && ctx.session.lastMenu != 0) {
            if (isAdmin) {
                await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);
            }
            await ctx.api.deleteMessage(ctx.chat!.id, ctx.session.lastMenu);
        }

        const sent = await ctx.reply(daySchedule, { reply_markup: pagesMenu });

        ctx.session.user = ctx.message!.from!.id;
        ctx.session.lastMenu = sent.message_id;
    } catch (err) {
        log.error("Failed to parse group!");
        await ctx.reply("Неправильный номер группы!");
    }
};

const composer = new Composer<CustomContext>();
composer.use(conversations());

composer.use(createConversation(schedule));
composer.use(createConversation(setGroup));

composer.use(limit(
    {
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
    }
));

composer.command("schedule", async (ctx: CustomContext) => {
    const kicked = (await ctx.getChatMember(ctx.me.id)).status == "kicked";
    if (kicked) {
        return;
    }

    await ctx.conversation.enter("schedule");
});

composer.command("setgroup", async (ctx: CustomContext) => {
    await ctx.conversation.enter("setGroup");
});

composer.command("now", async (ctx: CustomContext) => {
    moment.updateLocale("ru", {
        week: {
            dow: 1,
            doy: 7
        }
    });

    if (ctx.session.schedule.length == initialSession().schedule.length) {
        await ctx.conversation.reenter("setGroup");
        return;
    }

    const weekday = moment().isoWeekday() - 1;

    if (weekday >= ctx.session.schedule.length) {
        await ctx.reply("🕊️ Сегодня нет пар!");
        return;
    }

    const day = ctx.session.schedule[weekday];

    let nextLesson: Lesson | null = null;
    for (const lesson of day) {
        if (moment().isBetween(moment(lesson.startTime, "HH:mm"), moment(lesson.endTime, "HH:mm"))) {
            await ctx.reply(`Сейчас 📓 ${lesson.course} в 📍 ${lesson.classroom}`);
            return;
        }

        if (moment().isBefore(moment(lesson.startTime, "HH:mm"))) {
            if (moment(lesson.startTime, "HH:mm") < moment(nextLesson?.startTime, "HH:mm") || nextLesson == null)
                nextLesson = lesson;
        }
    }

    console.log(nextLesson?.startTime);
    if (nextLesson)
        await ctx.reply(`📓 ${nextLesson.course} ${moment(nextLesson.startTime, "HH:mm").fromNow()} в 📍 ${nextLesson.classroom}`);
    else
        await ctx.reply("🎉 Пары закончились!");
});

composer.command("cancel", async (ctx: CustomContext) => {
    await ctx.conversation.exit();
});

export default composer;