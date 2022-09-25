"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagesMenu = void 0;
const menu_1 = require("@grammyjs/menu");
const utils_1 = require("./utils/utils");
const utils_2 = require("./utils/utils");
const changePage = async (ctx, direction) => {
    const inBounds = direction == "prev" ? ctx.session.page - 1 >= 0 : ctx.session.page + 1 < ctx.session.schedule.length;
    const pressedByUser = ctx.callbackQuery?.from.id == ctx.session.user;
    if (inBounds && pressedByUser) {
        ctx.session.page += (direction == "prev" ? -1 : 1);
        await ctx.editMessageText((0, utils_1.buildSchedule)(ctx.session.schedule[ctx.session.page]));
    }
};
exports.pagesMenu = new menu_1.Menu("pages", { onMenuOutdated: "Updated, try now." })
    .text("‹", async (ctx) => {
    changePage(ctx, "prev");
})
    .text((ctx) => `· 📅 ${utils_2.daysOfTheWeek[ctx.session.page]} ·`)
    .text("›", async (ctx) => {
    changePage(ctx, "next");
});
