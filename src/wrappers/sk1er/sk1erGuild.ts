
import fetch from "node-fetch";
const USER_AGENT = process.env.USER_AGENT!;
const main = `https://api.sk1er.club/guild/name/`;
import mojang from "../mojang/mojangPlayer";
export default async function get(query) {
    return new Promise<any>(async res => {
        let unparsed = await fetch(main + query.replace(/ /g, "+"), { headers: { ["user-agent"]: USER_AGENT } });
        let data = await unparsed.json();
        res(data.guild || { exists: false })
    })
}