import { Lesson } from "../types";
import * as fs from "fs";
import pdf from "pdf-parse";
import { log } from "./logger";

export const initialSession = () => {
    return {
        page: 0,
        user: 0,
        lastMenu: 0,
        schedule: [
            [
                {
                    startTime: "",
                    endTime: "",
                    course: "",
                    classroom: "",
                    type: "",
                    lecturer: ""
                }
            ]
        ]
    };
};

export const daysOfTheWeek: { [index: number]: string; } = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
};

export const buildSchedule = (day: Lesson[]): string => {
    let lessonString = "";
    day.forEach((lesson) => {
        lessonString += `⏰ ${lesson.startTime} - ${lesson.endTime} \n📓 ${lesson.course}\n📍 ${lesson.classroom} (${lesson.type})\n\n`;
    });

    return lessonString;
};

const regexDays = /(?<=Monday|Tuesday|Wednesday|Thursday|Friday)(.*?)(?=Monday|Tuesday|Wednesday|Thursday|Friday|$)/g;
const regexLessons = /(\d+:\d+)-(\d+:\d+)(.*?)(C1\.\d\.\d+[P|K|L]?|C1\.\d\.\d+[P|K|L]? \/C1\.\d\.\d+[P|K|L]?|gym|Mediateka).*?((?:(?:practice|lecture) \/ (?:practice|lecture))|(?:practice|lecture))(\D+)/g;

export const getSchedule = async (group: string): Promise<Lesson[][]> => {
    const courseRegex = [...group.matchAll(/([a-zA-Z]+)-(\d+)/g)][0];
    const course = courseRegex[1];
    let path = "";
    switch (course) {
        case "BDA":
        case "IT":
        case "ITE":
        case "MT":
        case "ITM":
        case "DJ":
            path = "resources/BDA_IT_ITE_MT_ITM_DJ.pdf";
            break;
        case "CS":
            if (parseInt(courseRegex[2]) < 16) {
                path = "resources/CS1-15.pdf";
            } else {
                path = "resources/CS16-30.pdf";
            }
            break;
        case "IA":
        case "ST":
        case "TS":
            path = "resources/IA_ST_TS.pdf";
            break;
        case "SE":
            path = "resources/SE.pdf";
            break;

    }
    const scheduleFile = fs.readFileSync(path);

    const pdfText = await pdf(scheduleFile);
    const text = pdfText.text.replace(/(\r\n|\n|\r)/gm, "").split(group)[1].split("\"Approved by")[0].split("Lecturer")[1];
    const days = text.replace(/\/practice/g, "/ practice").match(regexDays);

    if (!days) {
        log.error(`${group}: Schedule not found`);
        throw "Schedule not found";
    }

    const schedule: Lesson[][] = days.map(day => {
        const daySchedule: Lesson[] = [];
        const dayList = [...day.matchAll(regexLessons)];

        dayList.forEach(list => {
            daySchedule.push({
                startTime: list[1],
                endTime: list[2],
                course: list[3],
                classroom: list[4],
                type: list[5],
                lecturer: list[6]
            });
        });

        return daySchedule;
    });

    log.debug(`Parsed schedule for ${group}`);
    return schedule;
};