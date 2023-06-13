const uuidToUsername = (uuid) => `https://api.mojang.com/user/profile/${uuid}`;
const usernameToUUID = (username) => `https://api.mojang.com/users/profiles/minecraft/${username}`;
const fetch = require("node-fetch")

export default async function get(query) {
    return new Promise<any>(async res => {
        let url = query.length > 16 ? uuidToUsername(query) : usernameToUUID(query);
        let resp = await fetch(url)
        resp.json().then(body => {
            body.error && res(0);
            res(body);
        }).catch(e => {
            res(0)
        })

    })
}
