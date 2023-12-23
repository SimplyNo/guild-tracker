const uuidToUsername = (uuid) => `https://api.mojang.com/user/profile/${uuid}`;
const usernameToUUID = (username) => `https://api.mojang.com/users/profiles/minecraft/${username}`;
const fetch = require("node-fetch")
import { redis } from "../../index";

const cacheLifespan = 72 * 60 * 60 * 1000;
export default async function get(query) {
    return new Promise<any>(async res => {
        let url = query.length > 16 ? uuidToUsername(query) : usernameToUUID(query);
        // check cache

        let cache = await redis.get(`cache-mojang:${url}`);
        // let cache = false;
        // console.log(cache)
        if (cache) {
            console.log(`[CACHE] ${query} was cached! Using cache: ${cache}`)
            return res(JSON.parse(cache || "{}"));
        }

        let resp = await fetch(url);
        resp.json().then(body => {
            console.log('query:', query)
            body.error && res(0);
            console.log('body:', resp.status, body)
            if (!cache) redis.setex(`cache-mojang:${url}`, cacheLifespan, JSON.stringify(body));
            res(body);
        }).catch(e => {
            res(0)
        })

    })
}
