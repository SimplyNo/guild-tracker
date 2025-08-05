import { Router } from "express";
import { APIUpdater } from "../..";
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchRouter = Router();
searchRouter.get('/api/search/:name', async (req, res) => {
    const searchQuery = req.params.name;
    console.time(`tracked`)
    const tracked: any = await APIUpdater.APIModel
        .find(
            { name_lower: new RegExp(`^${escapeRegExp(searchQuery)}`, "i") },  // match
            { _id: 0, name_lower: 1, name: 1 }                             // projection
        )
        .sort({ exp: -1 })                                      // sort
        .limit(25)                                              // cap
        .hint({ name_lower: 1, exp: -1, name: 1 })                       // force compound index
        .lean()                                                 // return plain JS objects
        .exec();
    // let aggregation: mongoose.PipelineStage[] = [
    //     { "$match": { 'name_lower': { '$regex': `\^${searchQuery}`, '$options': 'i' } } },
    //     { "$sort": { exp: -1 } },
    //     { "$project": { name: 1, } },
    //     // { $sort: { "field_length": 1 } },
    //     // { $project: { "field_length": 0 } },
    //     { "$limit": 25 }
    // ]
    // const tracked: TrackedGuild[] | null = await APIUpdater.APIModel.aggregate(aggregation).exec().then(e => e).catch(e => null)
    console.log('tracked:', tracked);
    if (tracked) {
        console.timeEnd('tracked')
        return res.json(tracked);
    }
    return res.json({ error: 'untracked', message: 'That guild is not tracked.' })

})