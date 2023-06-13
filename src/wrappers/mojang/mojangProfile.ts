const api = `https://sessionserver.mojang.com/session/minecraft/profile/`
import fetch from "node-fetch";
export default async function get(query) {
    return new Promise<any>(async res => {
        let url = api + query;
        let resp = await fetch(url)
        resp.json().then(body => {
            body.error && res(0);
            res(body);
        }).catch(e => {
            res(0)
        })

    })
}
