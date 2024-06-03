
import { Collection } from "@discordjs/collection";
import fetch, { Response } from "node-fetch";
import { hypixelKeys as KEYS } from "../../../config.json";
import { Util } from "../../util/Util";
const main = () => `http://api.hypixel.net/player?key=${KEYS[Math.floor(Math.random() * (KEYS.length))]}&uuid=`;
const playerDB = `https://playerdb.co/api/player/minecraft/`;
import { getRank, getPlusColor, getEmojiRank, getFormattedRank, getPlusColorMC, getSk1erRank, getEmojiRankFromFormatted, getLevel } from '../functions/general';
import { redis } from "../../index";

const cacheLifespan = 90;
let lastTimeReset = 30;



export default async function get(query) {
    return new Promise<any>(async res => {
        if (!query) return res({ displayname: query, exists: false })
        // console.log(cache.has(query))

        if (query.length <= 16) {
            let $uuid = await fetch(playerDB + query);
            try {
                let uuid = await $uuid.json();
                query = uuid.data.player.id;
            } catch (e) {
                console.log(e);
                return res(null);
            }
        } else {
            query = query.replace(/-/g, "");
        }

        // handle caching
        const isCached = await redis.exists(`cache-player:${query}`);
        if (isCached) {
            // console.log(new Error())
            // get teh api cache that is an object:
            const cache = JSON.parse((await redis.get(`cache-player:${query}`)) || "{}");

            console.log(`[CACHE] ${query} was cached! Using cache: ${cache.displayname}`)
            // console.log(`cache:`, cache.get(query).displayname)
            return res(cache);
        }
        let data: any = { throttle: true };
        while (data?.throttle) {
            const q = main() + query;
            // console.log(`[Hypixel-Player] Fetching Stats of ${q}...`);
            let unparsed = await (Promise.race([fetch(q), new Promise(res => setTimeout(() => res({ fetchtimeout: true }), 10000))])) as any as Response | { fetchtimeout: number };

            // maybe timeout ?? idfk .
            if (!(unparsed instanceof Response)) {
                console.log('THE TIME OUT WORKED ?!')
                return res(null);
            }

            data = await unparsed.json().catch(e => ({ outage: true }));
            // console.log(`[Hypixel-Player] Fetched stats of ${query}! (parsed)`, util.inspect(data, { depth: 0, colors: true }));
            // console.log(`${q}`, data.displayname)
            if (data?.throttle) {
                // console.log(`running throttle loop`)
                const nextReset = parseInt(unparsed.headers.get('retry-after') as string) || (lastTimeReset ?? 30);
                lastTimeReset = nextReset;
                console.log(`[HYPIXEL-PLAYER] Key throttled:`, data, `Trying again in ${nextReset} seconds...`)
                await Util.wait(nextReset * 1000)
            }
        }
        if (data.outage) return res({ outage: true })

        if (!data.player) {
            console.log(data);
            return res(null);
        }
        data.player.rank = getRank(data.player)
        data.player.color = getPlusColor(data.player.rankPlusColor, data.player.rank)
        data.player.emojiRank = getEmojiRank(data.player)

        data.player.mcPlusColor = getPlusColorMC(data.player.rank, data.player.rankPlusColor)
        data.player.formattedRank = getFormattedRank(data.player.rank, data.player.mcPlusColor)
        data.player.level = getLevel(data.player.networkExp)
        data.player.quests_ = data.player.quests;
        if (data.player.quests) data.player.quests = Object.fromEntries(Object.entries(data.player.quests).map(([k, v]: [any, any]) => ([k, v.completions?.length])).filter(([k, v]) => v))
        if (data.player.challenges) data.player.challenges = Object.values(data.player.challenges.all_time).reduce((p: any, c: any) => p + c, 0)
        // console.log(`setting cache: ${query} to ${data.player.displayname}`)

        if (!isCached) redis.setex(`cache-player:${query}`, cacheLifespan, JSON.stringify(data.player));
        // console.log(`cache size: ${cache.size}`)

        res(data.player)
    })
}
// const BASE = 10000;
// const GROWTH = 2500;
// const HALF_GROWTH = 0.5 * GROWTH;
// const REVERSE_PQ_PREFIX = -(BASE - 0.5 * GROWTH) / GROWTH;
// const REVERSE_CONST = REVERSE_PQ_PREFIX * REVERSE_PQ_PREFIX;
// const GROWTH_DIVIDES_2 = 2 / GROWTH;