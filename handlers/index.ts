import { Composer } from "grammy";

import start from "./start";
import schedule from "./schedule";
import { CustomContext } from "../types";
import { BotCommand } from "grammy/out/types.node";

export const commandList: BotCommand[] = [
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

const composer = new Composer<CustomContext>();

composer.use(start);
composer.use(schedule);

export default composer;