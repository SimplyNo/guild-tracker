const playerDB = `https://playerdb.co/api/player/minecraft/`;
import { redis } from "../../index";

const cacheLifespan = 72 * 60 * 60;

import fetch from "node-fetch";
import { Wrappers } from "../Wrappers";
export default async function get(query) {
    return new Promise<any>(async res => {
        let url = playerDB + query;
        let isCached = await redis.exists(`cache-playerDB:${url}`);
        if (isCached) {
            const cache = JSON.parse((await redis.get(`cache-playerDB:${url}`)) || "{}");
            if (cache) {
                return res(cache?.data?.player);
            }
        }

        let resp = await fetch(url).catch(e => console.error('PLAYER DB Error: ', e));
        const body = await resp?.json().catch(e => null);
        // body?.error && res(0);
        if (query === '8c988b0f8efd47f0a12f35f4b9fff58b') console.log(`player db responding...`, body)
        if (!isCached && body?.data?.player) redis.setex(`cache-playerDB:${url}`, cacheLifespan, JSON.stringify(body));
        res(body?.data?.player);
    })
}
