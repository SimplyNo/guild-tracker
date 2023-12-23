
import fetch from "node-fetch";
import { hypixelKeys as KEYS } from "../../../config.json";
import { Util } from "../../util/Util";
import { APIUpdater, redis } from "../../index";
import { getLevel } from "../functions/general";
import mojang from "../mojang/mojangPlayer";
import sk1er from "../sk1er/sk1erGuild";
import { HypixelGuildResponse } from "../../schemas/Guild";
const endpoints = {
    player: "&player=",
    id: "&id=",
    name: "&name="
}
const main = (endpoint: keyof typeof endpoints) => `http://api.hypixel.net/guild?key=${KEYS[Math.floor(Math.random() * (KEYS.length))]}${endpoints[endpoint]}`;

const cacheLifespan = 60;
let lastTimeReset = 30;
export default async function get<parseNames extends Boolean>(query: string, type: 'player' | 'id' | 'name', options?: { parseNames?: parseNames, cache?: boolean, updateAPI?: boolean }): Promise<HypixelGuildResponse<parseNames>> {
    return new Promise(async (res, rej) => {
        options = Object.assign({ parseNames: false, cache: true, updateAPI: true }, options || {});
        const { parseNames, cache, updateAPI } = options;
        if (type == 'player' && 16 >= query.length) {
            let mojangp = await mojang(query);
            if (!mojangp) return rej({ error: 'notfound', message: 'Player could not be found.' })
            query = mojangp.id;
        }

        // handle caching

        const isCached = cache ? await redis.exists(`cache-guild:${query}`) : false;
        if (isCached) {
            // console.log(new Error())
            // get teh api cache that is an object:
            const cache = JSON.parse((await redis.get(`cache-guild:${query}`)) || "{}");

            console.log(`[CACHE] ${query} was cached! Using cache: ${cache.name}`)
            // console.log(`cache:`, cache.get(query).displayname)

            return res({ cached: true, ...cache });
        }

        let data: any = { throttle: true };
        while (data?.throttle) {
            let unparsed = await fetch(main(type) + encodeURI(query)).catch(e => null);
            if (!unparsed) return rej({ error: 'fetcherror', message: 'Error whilst fetching API' })
            data = await unparsed?.json().catch(e => ({ outage: true }));
            if (data?.throttle) {
                const nextReset = parseInt(unparsed.headers.get('retry-after') as string) || (lastTimeReset ?? 30);
                console.log(`[HYPIXEL-GUILD] Key throttled:`, data, `Trying again in ${nextReset} seconds...`)
                await Util.wait(nextReset * 1000)
            }
        }

        if (data.outage) return rej({ error: 'outage', message: 'Hypixel Outage' })
        if (!data.guild) return rej({ error: 'notfound', message: 'Could not find this guild' })


        let members = data.guild.members;
        let sk1erData;
        if (parseNames) {
            sk1erData = await sk1er(data.guild.name);
            if (sk1erData.exists == false) sk1erData = { members: [] }
        }
        for (const [index, member] of members.entries()) {
            if (parseNames) {
                let sk1erName = sk1erData.members.find(m => m.uuid == member.uuid);
                if (!sk1erName || !sk1erName.name) {
                    // Get mojang name
                    let username = await mojang(member.uuid);
                    if (!username) username = [{ name: "???" }];
                    data.guild.members[index].username = username.name;
                } else {
                    data.guild.members[index].username = sk1erName.name;
                }
            }

            // set member vars:
            let weekly = Object.entries(member.expHistory).reduce((prev, current) => prev + parseInt(current[1] as string), 0);
            data.guild.members[index].weekly = weekly;


            // fill rnkas
            if (data.guild && data.guild.ranks) {
                let ranks = Array.from(new Set(data.guild.members.map(el => el.rank)));
                let missing = ranks.filter((el) => !data.guild.ranks.find(e => e.name == el));
                if (missing.includes(data.guild.members[index].rank) && !["Guild Master", "GUILDMASTER"].includes(data.guild.members[index].rank)) {
                    let defaultRank = data.guild.ranks.find(e => e.default);
                    data.guild.members[index].rank = defaultRank?.name;
                }
            }
        }
        // misc
        const scaledExpHistory = data.guild.members.map((value, index) => Object.values(value.expHistory)).reduce((prev, curr) => curr.map((v, i) => prev[i] += v), [0, 0, 0, 0, 0, 0, 0]).map((e) => scaledGEXP(e))
        data.guild.scaledExpHistory = scaledExpHistory.reduce((prev, curr, index) => Object.assign({ [Object.keys(data.guild.members[0].expHistory)[index]]: curr }, prev), {})

        const expHistory = data.guild.members.map((value, index) => Object.values(value.expHistory)).reduce((prev, curr) => curr.map((v, i) => prev[i] += v), [0, 0, 0, 0, 0, 0, 0])
        data.guild.expHistory = expHistory.reduce((prev, curr, index) => Object.assign({ [Object.keys(data.guild.members[0].expHistory)[index]]: curr }, prev), {})

        // color
        data.guild.tagColor && (data.guild.tagColor = colorMap[data.guild.tagColor]);

        // level
        let level = guildLevel(data.guild.exp);
        data.guild.level = level.level;
        data.guild.expToNextLevel = level.nextLevel;

        // do api updating
        if (updateAPI) {
            await APIUpdater.updateGuild(data.guild);
        }
        data.guild ? res({ cached: false, ...data.guild }) : rej({ error: 'error', message: 'Something went wrong!' })
        if (!isCached) redis.setex(`cache-guild:${query}`, cacheLifespan, JSON.stringify(data.guild));
    })
}

function guildLevel(exp) {
    const EXP_NEEDED = [
        100000,
        150000,
        250000,
        500000,
        750000,
        1000000,
        1250000,
        1500000,
        2000000,
        2500000,
        2500000,
        2500000,
        2500000,
        2500000,
        3000000
    ];
    var level = 0;

    for (let i = 0; i <= 1000; i += 1) {
        var need = 0;

        if (i >= EXP_NEEDED.length) need = EXP_NEEDED[EXP_NEEDED.length - 1];
        else need = EXP_NEEDED[i];

        if (exp - need < 0)
            return {
                level: Math.round((level + exp / need) * 100) / 100,
                nextLevel: Math.round(need - exp)
            };

        level += 1;
        exp -= need;
    }

    return { level: 1000, nextLevel: 0 };
};

function numberfy(str: string) {
    let result = "";
    Array.from(str).forEach(c => {
        result += c.charCodeAt(0).toString().slice(1);
    })
    return result
}
function scaledGEXP(input) {
    if (input <= 200000) return Number(input);
    if (input <= 700000) return Number(Math.round(((input - 200000) / 10) + 200000));
    if (input > 700000) return Number(Math.round(((input - 700000) / 33) + 250000));
}
const colorMap = {
    WHITE: { code: '§f', hex: '#F2F2F2', color: 'WHITE' },
    YELLOW: { code: '§e', hex: '#FFFF55', color: 'YELLOW' },
    LIGHT_PURPLE: { code: '§d', hex: '#FF55FF', color: 'LIGHT_PURPLE' },
    RED: { code: '§c', hex: '#FF5555', color: 'RED' },
    AQUA: { code: '§b', hex: '#55FFFF', color: 'AQUA' },
    GREEN: { code: '§a', hex: '#55FF55', color: 'GREEN' },
    BLUE: { code: '§9', hex: '#5555FF', color: 'BLUE' },
    DARK_GRAY: { code: '§8', hex: '#555555', color: 'DARK_GRAY' },
    GRAY: { code: '§7', hex: '#BAB6B6', color: 'GRAY' },
    GOLD: { code: '§6', hex: '#FFAA00', color: 'GOLD' },
    DARK_PURPLE: { code: '§5', hex: '#AA00AA', color: 'DARK_PURPLE' },
    DARK_RED: { code: '§4', hex: '#AA0000', color: 'DARK_RED' },
    DARK_AQUA: { code: '§3', hex: '#00AAAA', color: 'DARK_AQUA' },
    DARK_GREEN: { code: '§2', hex: '#00AA00', color: 'DARK_G    REEN' },
    DARK_BLUE: { code: '§1', hex: '#0000AA', color: 'DARK_BLUE' },
    BLACK: { code: '§0', hex: '#000000', color: 'BLACK' }
};