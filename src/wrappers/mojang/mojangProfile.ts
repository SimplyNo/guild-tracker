const api = `https://sessionserver.mojang.com/session/minecraft/profile/`
import { redis } from "../../index";

const cacheLifespan = 72 * 60 * 60 * 1000;

import fetch from "node-fetch";
export default async function get(query) {
    return new Promise<any>(async res => {
        let url = api + query;
        let isCached = await redis.exists(`cache-mojang:${url}`);
        if (isCached) {
            const cache = JSON.parse((await redis.get(`cache-mojang:${url}`)) || "{}");
            return res(cache);
        }

        let resp = await fetch(url)
        resp.json().then(body => {
            body.error && res(0);
            if (!isCached) redis.setex(`cache-mojang:${url}`, cacheLifespan, JSON.stringify(body));
            res(body);
        }).catch(e => {
            res(0)
        })
    })
}
