import fetch from 'node-fetch';
import { redis } from '../..';
const cacheLifespan = 72 * 60 * 60;

export default async function get(player) {
    return new Promise<any>(async (resolve, reject) => {
        let body;
        if (!player) return resolve({ exists: false })
        let cache = await redis.get(`cache-ashcon:${player.toLowerCase()}`);
        if (cache) {
            // console.log(`[CACHE] ${query} was cached! Using cache: ${cache}`)
            return resolve(JSON.parse(cache || "{}"));
        }

        const data = await fetch(`https://api.ashcon.app/mojang/v2/user/${player}`).catch(e => console.error(`ashcon error: `, e));
        try { body = await data.json() } catch { return resolve({ outage: true }) }
        if (!body) return;
        if (!body?.uuid) return resolve({ exists: false })
        body.uuid = body.uuid.replace(/-/g, '');
        body.exists = true;

        if (body && !cache) redis.setex(`cache-ashcon:${player.toLowerCase()}`, cacheLifespan, JSON.stringify({ uuid: body.uuid, username: body.username }));
        resolve(body)
    })
}

