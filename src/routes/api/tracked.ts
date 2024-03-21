import { Router } from "express";
import mongoose from "mongoose";
import { APIUpdater } from "../..";
import { TrackedGuild, TrackedMember } from "../../schemas/Guild";
import { Wrappers } from "../../wrappers/Wrappers";

export const trackedRouter = Router();
trackedRouter.get('/api/tracked/:name', async (req, res) => {
    const options = {
        type: <'player' | 'name' | 'id'>req.query.type || 'name',
        fetch: <string>req.query.fetch || false,
        lean: <string>req.query.lean || false,
        parseNames: <string>req.query.parseNames || false,
        currentMembersOnly: <string>req.query.currentMembersOnly || false
    }
    const guildQuery = req.params.name;
    const query = {
        name: async () => ({ name_lower: guildQuery.toLowerCase() }),
        player: async () => ({ allMembers: { $elemMatch: { uuid: (guildQuery.length <= 16 ? (await Wrappers.mojang.player(guildQuery)).id : guildQuery), inGuild: true } } }),
        id: async () => ({ _id: new mongoose.Types.ObjectId(guildQuery) })
    }
    if (options.fetch) {
        // it will update the api automatically.
        const data = await Wrappers.hypixel.guild(req.params.name, options.type, { updateAPI: true }).catch(e => e);
        if (data.error) return res.json(data);
    }
    console.time('tracked')
    let aggregation: mongoose.PipelineStage[] = [
        { "$match": (await query[options.type]()) },
        { "$limit": 1 }
    ]
    if (options.lean) aggregation.push({ "$project": { expHistory: 0 } })
    if (options.currentMembersOnly) aggregation.push({ "$redact": { "$cond": [{ "$eq": [{ $ifNull: ["$inGuild", true] }, true] }, "$$DESCEND", "$$PRUNE"] } })
    const tracked: TrackedGuild | null = await APIUpdater.APIModel.aggregate(aggregation).exec().then(e => e[0]).catch(e => null)
    if (tracked) {
        if (options.parseNames) {
            const usernames = (await Promise.all(tracked.allMembers.map(m => Wrappers.mojang.profile(m.uuid))));
            if (usernames) {
                tracked.allMembers.forEach((m, i) => {
                    const username = usernames.find(u => (u.id == m.uuid))?.name;
                    if (!username) console.log(`ERR! ${m.uuid} - ${username}`);
                    (tracked.allMembers as TrackedMember<true>[])[i] = { username, ...m };

                })
            }
        }

        console.timeEnd('tracked')
        return res.json(tracked);
    }
    return res.json({ error: 'untracked', message: 'That guild is not tracked.' })

})