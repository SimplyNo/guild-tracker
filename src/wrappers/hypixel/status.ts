
const fetch = require("node-fetch");
import { hypixelKeys as KEYS } from "../../../config.json";

const main = `http://api.hypixel.net/status?key=${KEYS[Math.floor(Math.random() * (KEYS.length))]}&uuid=`;
const mojang = `https://api.mojang.com/users/profiles/minecraft/`;


export default async function get(query) {
    return new Promise<any>(async res => {
        if (query.length <= 16) {
            let $uuid = await fetch(mojang + query);
            try {
                let uuid = await $uuid.json();
                query = uuid.id;
            } catch (e) {
                res(0);
            }
        } else {
            query = query.replace(/-/g, "");
        }
        let unparsed = await fetch(main + query);
        let data = await unparsed.json().catch(e => ({ outage: true }));
        if (data.outage) return res(data);
        res(data)
    })
}
