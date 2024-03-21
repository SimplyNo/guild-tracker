import { Router } from "express";
import mongoose from "mongoose";
import { APIUpdater } from "../..";
import { TrackedGuild, TrackedMember } from "../../schemas/Guild";
import { Wrappers } from "../../wrappers/Wrappers";

export const searchRouter = Router();
searchRouter.get('/api/search/:name', async (req, res) => {
    const searchQuery = req.params.name;
    console.time(`tracked`)
    let aggregation: mongoose.PipelineStage[] = [
        { "$sort": { exp: -1 } },
        { "$match": { 'name_lower': { '$regex': `\^${searchQuery}`, '$options': 'i' } } },
        { "$project": { name: 1, } },
        // { $sort: { "field_length": 1 } },
        // { $project: { "field_length": 0 } },
        { "$limit": 25 }
    ]
    const tracked: TrackedGuild[] | null = await APIUpdater.APIModel.aggregate(aggregation).exec().then(e => e).catch(e => null)
    console.log('tracked:', tracked);
    if (tracked) {
        console.timeEnd('tracked')
        return res.json(tracked);
    }
    return res.json({ error: 'untracked', message: 'That guild is not tracked.' })

})