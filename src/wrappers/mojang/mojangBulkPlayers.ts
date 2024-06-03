const fetch = require("node-fetch")

import { redis } from "../../index";

const cacheLifespan = 72 * 60 * 60;
export default async function get(usernames: string[]) {
    return new Promise<any>(async (res, rej) => {
        let cache = await redis.get(`cache-mojang-bulk:${usernames}`);
        if (cache) {
            console.log(`[CACHE] ${usernames} was cached! Using cache: ${cache}`)
            return res(JSON.parse(cache || "{}"));
        }
        let headers = new fetch.Headers();
        headers.append("Content-Type", "application/json");
        let raw = JSON.stringify(usernames);
        let requestOptions = {
            method: 'POST',
            headers,
            body: raw,
            redirect: 'follow'
        };
        let resp = await fetch("https://api.minecraftservices.com/minecraft/profile/lookup/bulk/byname", requestOptions)
        resp.json().then(body => {
            console.log('usernames:', usernames)
            body.error && rej(0);
            console.log('body:', resp.status, body)
            if (!cache) redis.setex(`cache-mojang-bulk:${usernames}`, cacheLifespan, JSON.stringify(body));
            res(body);
        }).catch(e => {
            console.error(e);
            rej(0)
        })
    })
}
