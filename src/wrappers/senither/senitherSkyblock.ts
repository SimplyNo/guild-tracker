import { hypixelKeys as KEYS } from "../../../config.json";

const getAPI = (uuid: string) => `https://hypixel-api.senither.com/v1/profiles/${uuid}/weights?key=${KEYS[Math.floor(Math.random() * KEYS.length)]}`;
import fetch from 'node-fetch';

export default async function get(name) {
    return new Promise<any>(async res => {
        let data = await fetch(getAPI(name));
        data.json().then(body => {
            if (body?.status == 200) {
                res(body);
            } else {
                res(0);
            }
        }).catch(e => {
            res(0);
        })
    })
}
