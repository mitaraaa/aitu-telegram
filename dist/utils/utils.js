"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedule = exports.buildSchedule = exports.daysOfTheWeek = exports.initialSession = void 0;
const fs = __importStar(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const logger_1 = require("./logger");
const initialSession = () => {
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
exports.initialSession = initialSession;
exports.daysOfTheWeek = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
};
const buildSchedule = (day) => {
    let lessonString = "";
    day.forEach((lesson) => {
        lessonString += `⏰ ${lesson.startTime} - ${lesson.endTime} \n📓 ${lesson.course}\n📍 ${lesson.classroom} (${lesson.type})\n\n`;
    });
    return lessonString;
};
exports.buildSchedule = buildSchedule;
const regexDays = /(?<=Monday|Tuesday|Wednesday|Thursday|Friday)(.*?)(?=Monday|Tuesday|Wednesday|Thursday|Friday|$)/g;
const regexLessons = /(\d+:\d+)-(\d+:\d+)(.*?)(C1\.\d\.\d+[P|K|L]?|C1\.\d\.\d+[P|K|L]? \/C1\.\d\.\d+[P|K|L]?|gym|Mediateka).*?((?:(?:practice|lecture) \/ (?:practice|lecture))|(?:practice|lecture))(\D+)/g;
const getSchedule = async (group) => {
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
            }
            else {
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
    const pdfText = await (0, pdf_parse_1.default)(scheduleFile);
    const text = pdfText.text.replace(/(\r\n|\n|\r)/gm, "").split(group)[1].split("\"Approved by")[0].split("Lecturer")[1];
    const days = text.replace(/\/practice/g, "/ practice").match(regexDays);
    if (!days) {
        logger_1.log.error(`${group}: Schedule not found`);
        throw "Schedule not found";
    }
    const schedule = days.map(day => {
        const daySchedule = [];
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
    logger_1.log.debug(`Parsed schedule for ${group}`);
    return schedule;
};
exports.getSchedule = getSchedule;
