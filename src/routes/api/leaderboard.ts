import { Router } from "express";
import mongoose from "mongoose";
import { APIUpdater } from "../..";
import { TrackedGuild, TrackedMember } from "../../schemas/Guild";
import { Wrappers } from "../../wrappers/Wrappers";

export const leaderboardRouter = Router();
leaderboardRouter.get('/api/leaderboard/:name', async (req, res) => {
    const options = {
        type: <'player' | 'name' | 'id'>req.query.type || 'name',
    }
    const guildQuery = req.params.name;
    const query = {
        name: async () => ({ name_lower: guildQuery.toLowerCase() }),
        player: async () => ({ allMembers: { $elemMatch: { uuid: (guildQuery.length <= 16 ? (await Wrappers.mojang.player(guildQuery)).id : guildQuery), inGuild: true } } }),
        id: async () => ({ _id: new mongoose.Types.ObjectId(guildQuery) })
    }
    console.time('tracked')
    let aggregation: mongoose.PipelineStage[] = [
        { "$sort": { exp: -1 } },
        { "$project": { name: 1, exp: 1 } },
        { "$limit": 10 }
    ]
    const tracked: TrackedGuild[] | null = await APIUpdater.APIModel.aggregate(aggregation).exec().then(e => e).catch(e => null)
    if (tracked) {

        console.timeEnd('tracked')
        return res.json(tracked);
    }
    return res.json({ error: 'error', message: 'No leaderboard' })

})