import fs from "fs";
import path from "path";
import Chalk from "chalk";
const table = {
    0: Chalk.black,
    1: Chalk.blue,
    2: Chalk.green,
    3: Chalk.cyan,
    4: Chalk.red,
    5: Chalk.magenta,
    6: Chalk.yellow,
    7: Chalk.gray,
    8: Chalk.white,
    9: Chalk.bgBlue,
    a: Chalk.greenBright,
    b: Chalk.cyanBright,
    c: Chalk.redBright,
    d: Chalk.bgRedBright,
    e: Chalk.yellowBright,
    f: Chalk.white
}
const randomChars = "abcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export class Util {
    public static randomIndex<T>(array: T[]) {
        return array[Math.floor(Math.random() * array.length)];
    }
    public static getNumberBetween(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    public static getChance(chance: number) {
        return Math.random() < chance;
    }
    public static getMonthDiff(d1: Date, d2: Date) {
        let months = 0;
        months = d2.getFullYear() - d1.getFullYear();
        months -= d1.getMonth();
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }
    public static parseMessageCodes(msg) {
        if (typeof msg !== "string") return msg;
        msg = '&f' + msg;
        let codes = msg.match(/&[0-9a-f]/g) || [];

        let ary = Array.from(msg);
        let parts: any = [];
        codes.forEach((char, i) => {
            let nextCodeStart = msg.indexOf(codes[i + 1]) != -1 ? msg.indexOf(codes[i + 1]) : ary.length;
            let index = msg.indexOf(char);
            let part = msg.slice(index, nextCodeStart);

            parts.push(table[char[1]](part.replace(char, '')))
            msg = msg.replace(part, '');
        })

        return parts.join('')
    }


    static splitMessage(text: string, { maxLength = 2_000, char = '\n', prepend = '', append = '' }): string[] {

        if (text.length <= maxLength) return [text];
        let splitText = [text];
        if (Array.isArray(char)) {
            while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
                const currentChar = char.shift();
                if (currentChar instanceof RegExp) {
                    splitText = splitText.flatMap(chunk => chunk.match(currentChar)) as string[];
                } else {
                    splitText = splitText.flatMap(chunk => chunk.split(currentChar));
                }
            }
        } else {
            splitText = text.split(char);
        }
        if (splitText.some(elem => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages: string[] = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        return messages.concat(msg).filter(m => m);
    }
    public static getAllFiles(dirPath, arrayOfFiles?) {
        const files = fs.readdirSync(dirPath)
        arrayOfFiles = arrayOfFiles || [];
        files.forEach(function (file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) arrayOfFiles = Util.getAllFiles(dirPath + "/" + file, arrayOfFiles)
            else arrayOfFiles.push(path.join(dirPath, "/", file))
        })
        return arrayOfFiles;
    }

    public static parseTime(string = "") {
        let list = string.split(' ');
        let ms = 0;
        list.forEach(str => {
            if (str.length < 2) return;
            let suffix = str.slice(str.length - 1);
            let time = parseInt(str.slice(0, str.length - 1));
            console.log(suffix)
            if (isNaN(time)) return 0;
            if (suffix == 's') {
                ms += (time * 1000);
            } else if (suffix == 'm') {
                ms += (time * 60 * 1000)
            } else if (suffix == 'h') {
                ms += (time * 60 * 60 * 1000)
            } else if (suffix == 'd') {
                ms += (time * 24 * 60 * 60 * 1000)
            } else if (suffix == 'w') {
                ms += (time * 7 * 24 * 60 * 60 * 1000)
            }
        })
        let dateString = this.getDateString(ms);
        return !ms ? null : { ms: ms, string: dateString };
    }
    public static search(str: string, list: string[]) {
        let results: string[] = [];
        list.forEach(item => {
            if (item.toLowerCase().includes(str.toLowerCase())) results.push(item);
        })
        return results;
    }
    public static getDiscordTimeFormat(ms: number, type: 'R' | 'f' | 'D') {
        return `<t:${Math.floor(ms / 1000)}:${type}>`

    }
    public static genHeadImage(uuid: string) {
        return "https://crafatar.com/avatars/" + uuid + "?overlay=true";
    }
    public static nFormatter(num: number, digits: number) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup.slice().reverse().find(function (item) {
            return num >= item.value;
        });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
    public static getDateString(ms: number, format = "%year% %yearStr% %month% %monthStr% %week% %weekStr% %day% %dayStr% %hour% %hourStr% %min% %minStr% %sec% %secStr%") {
        if (!ms) return "0 minutes and 0 seconds";
        let seconds = Math.floor(ms / 1000 % 60);
        let secondsStr = seconds && this.getPlural(seconds, 'second');
        let minutes = Math.floor(ms / 1000 / 60 % 60);
        let minutesStr = minutes && this.getPlural(minutes, 'minute');
        let hours = Math.floor(ms / 1000 / 60 / 60 % 24);
        let hoursStr = hours && this.getPlural(hours, 'hour');
        let days = Math.floor(ms / 1000 / 60 / 60 / 24 % 7);
        let daysStr = days && this.getPlural(days, 'day');
        let weeks = Math.floor(ms / 1000 / 60 / 60 / 24 / 7 % 31);
        let weeksStr = weeks && this.getPlural(weeks, 'week');
        let months = Math.floor(ms / 1000 / 60 / 60 / 24 / 7 / 31 % 365);
        let monthsStr = months && this.getPlural(months, 'month');
        let years = Math.floor(ms / 1000 / 60 / 60 / 24 / 7 / 31 / 365);
        let yearsStr = years && this.getPlural(years, 'year');

        let dateString = format
            .replace('%SEC%', seconds.toString())
            .replace('%SECSTR%', secondsStr.toString())
            .replace('%MIN%', minutes.toString())
            .replace('%MINSTR%', minutesStr.toString())
            .replace('%HOUR%', hours.toString())
            .replace('%HOURSTR%', hoursStr.toString())
            .replace('%DAY%', days.toString())
            .replace('%DAYSTR%', daysStr.toString())
            .replace('%WEEK%', weeks.toString())
            .replace('%WEEKSTR%', weeksStr.toString())
            .replace('%MONTH%', months.toString())
            .replace('%MONTHSTR%', monthsStr.toString())
            .replace('%YEAR%', years.toString())
            .replace('%YEARSTR%', yearsStr.toString())
            .replace('%sec%', String(seconds || ''))
            .replace('%secStr%', secondsStr || '')
            .replace('%min%', String(minutes || ''))
            .replace('%minStr%', minutesStr || '')
            .replace('%hour%', String(hours || ''))
            .replace('%hourStr%', hoursStr || '')
            .replace('%day%', String(days || ''))
            .replace('%dayStr%', daysStr || '')
            .replace('%week%', String(weeks || ''))
            .replace('%weekStr%', weeksStr || '')
            .replace('%month%', String(months || ''))
            .replace('%monthStr%', monthsStr || '')
            .replace('%year%', String(years || ''))
            .replace('%yearStr%', yearsStr || '')
        // console.log(dateString)
        // let dateString = `${years ? years + getPlural(years, ' year') : ''} ${months ? months + getPlural(months, ' month') : ''} ${weeks ? weeks + getPlural(weeks, ' week') : ''} ${days ? days + getPlural(days, ' day') : ''} ${hours ? hours + getPlural(hours, ' hour') : ''} ${minutes ? minutes + getPlural(minutes, ' minute') : ''} ${seconds ? seconds + getPlural(seconds, 'second') : ''}`.trim();
        // console.log(secondsStr, seconds)
        // console.log(minutesStr, minutes)
        return dateString.trim();
    }
    public static getPlural(num: number, string: string) {
        if (num == 1) return string;
        return string + 's';
    }
    public static formatDiscordMessage(message) {
        return message.replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/~/g, '\\~').replace(/`/g, '\\`').replace(/>/g, '\\>');
    }
    public static wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    public static genRandomChars(length: number) {
        let result = '';
        for (let i = 0; i < length; i++) {
            // genchar that isnt already in result


            let char = randomChars[Math.floor(Math.random() * randomChars.length)];
            while (result.includes(char)) {
                char = randomChars[Math.floor(Math.random() * randomChars.length)];
            }
            result += char;
        }
        return result;
    }
}