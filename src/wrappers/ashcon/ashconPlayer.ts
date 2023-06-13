import fetch from 'node-fetch';
export default async function get(player) {
    return new Promise<any>(async (resolve, reject) => {
        let body;
        if (!player) return resolve({ exists: false })
        const data = await fetch(`https://api.ashcon.app/mojang/v2/user/${player}`)
        try { body = await data.json() } catch { resolve({ outage: true }) }
        if (!body.uuid) return resolve({ exists: false })
        body.uuid = body.uuid.replace(/-/g, '')
        body.exists = true
        resolve(body)
    })
}

