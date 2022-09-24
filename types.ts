import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, SessionFlavor } from "grammy";

export interface Lesson {
    startTime: string;
    endTime: string;
    course: string;
    classroom: string;
    type: string;
    lecturer: string;
}

export interface SessionData {
    page: number;
    user: number;
    lastMenu: number;
    schedule: Lesson[][];
}

export type CustomContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type CustomConversation = Conversation<CustomContext>;