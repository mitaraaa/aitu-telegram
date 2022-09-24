import { Menu } from "@grammyjs/menu";
import { buildSchedule } from "./utils/utils";
import { CustomContext } from "./types";
import { daysOfTheWeek } from "./utils/utils";

const changePage = async (ctx: CustomContext, direction: "prev" | "next") => {
    const inBounds = direction == "prev" ? ctx.session.page - 1 >= 0 : ctx.session.page + 1 < ctx.session.schedule.length;
    const pressedByUser = ctx.callbackQuery?.from.id == ctx.session.user;

    if (inBounds && pressedByUser) {
        ctx.session.page += (direction == "prev" ? -1 : 1);
        await ctx.editMessageText(buildSchedule(ctx.session.schedule[ctx.session.page]));
    }
};

export const pagesMenu = new Menu<CustomContext>("pages", { onMenuOutdated: "Updated, try now." })
    .text("‹", async (ctx: CustomContext) => {
        changePage(ctx, "prev");
    })
    .text((ctx: CustomContext) => `· 📅 ${daysOfTheWeek[ctx.session.page]} ·`)
    .text("›", async (ctx: CustomContext) => {
        changePage(ctx, "next");
    });
