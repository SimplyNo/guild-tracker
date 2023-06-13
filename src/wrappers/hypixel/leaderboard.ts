import fetch from "node-fetch";
import { hypixelKeys as KEYS } from "../../../config.json";
import { Util } from "../../util/Util";

const main = () => `http://api.hypixel.net/leaderboards?key=${KEYS[Math.floor(Math.random() * (KEYS.length))]}`;

export default async function get() {
    return new Promise<any>(async res => {
        let data: any = { throttle: true };
        while (data?.throttle) {
            let unparsed = await fetch(main());
            data = await unparsed?.json().catch(e => ({ outage: true }));
            if (data?.throttle) {
                const nextReset = parseInt(unparsed.headers.get('retry-after') as string);
                console.log(`[HYPIXEL-LEADERBOARD] Key throttled:`, data, `Trying again in ${nextReset} seconds...`)
                await Util.wait(nextReset * 1000)
            }
        }

        if (data.outage) return res({ outage: true })
        return res(data.leaderboards);
    })
}