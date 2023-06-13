const getAPI = (name) => `https://sky.shiiyu.moe/api/v2/profile/${name}`;
import { Collection } from '@discordjs/collection';
import fetch from 'node-fetch';

const cache = new Collection<string, any>();

export default async function get(name) {
    return new Promise<any>(async res => {
        if (cache.has(name.toLowerCase())) {
            console.log(`[CACHE/SKYBLOCK] ${name} was cached!`)
            // console.log(`cache:`, cache.get(name).displayname)
            return res(cache.get(name));
        }


        let data = await fetch(getAPI(name)).catch(e => console.log(`SHIIYU FAILED!!`, e));
        if (!data) return res(0);
        data.json().then(body => {
            body.error && (console.log(`Error getting shiiyu skyblock:`, body.error)! && res(0));

            cache.set(name.toLowerCase(), body);
            res(body);
        }).catch(e => {
            console.log(`Error getting shiiyu skyblock:`, e);
            res(0);
        })
    })
}
