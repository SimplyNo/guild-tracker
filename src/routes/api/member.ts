import { Router } from "express";
import { APIUpdater } from "../..";
import { Wrappers } from "../../wrappers/Wrappers";

export const memberRouter = Router();
memberRouter.get('/api/member/:name', async (req, res) => {
    const query = req.params.name;
    const player = query.length <= 16 ? await Wrappers.mojang.bulkPlayers([query]).then(e => e[0]).catch(e => e) : await Wrappers.mojang.profile(query).catch(e => e);
    if (!player) return res.status(400).json({ error: 'API Error', message: 'No message provided' });
    if (player.error) return res.json(player);
    let uuid = player.id;
    let username = player.name;

    console.time('tracked')
    console.log(player)
    const tracked = await APIUpdater.APIModel.find({ "allMembers.uuid": uuid }, { name: 1, "allMembers.leftEstimate.$": 1, "allMembers.joined": 1 }, {}).lean().then(e => e).catch(e => null)
    if (tracked) {


        res.json(tracked.map(g => {
            let data: any = {
                guild: g.name,
                joined: new Date(g.allMembers[0].joined).getTime()
            }
            if (g.allMembers[0].leftEstimate) {
                const leftEstimateMin = new Date(g.allMembers[0].leftEstimate.estimateMin!).getTime();
                const leftEstimateMax = new Date(g.allMembers[0].leftEstimate.estimateMax!).getTime();
                const leftEstimate = (leftEstimateMin + leftEstimateMax) / 2;
                const leftEstimateError = (leftEstimateMax - leftEstimateMin) / 2;
                Object.assign(data, {
                    leftEstimate: {
                        leftEstimateMin,
                        leftEstimateMax,
                        estimate: leftEstimate,
                        error: leftEstimateError
                    }
                })
            }
            return (data);
        }))
        return console.timeEnd('tracked')
    }
    return res.status(400).json({ error: 'error', message: 'No member' })

})