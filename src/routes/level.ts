import { Router } from "express";
import { APIUpdater } from "..";

export const levelRouter = Router();
levelRouter.get('/level', async (req, res) => {
    const guilds = await APIUpdater.APIModel.find({}).sort({ exp: -1 }).limit(10).lean();
    const series = guilds.map(g => {
        return {
            name: g?.name,
            data: g?.expHistory.slice(-10000)
        }
    })
    return res.render('level.ejs', { guilds: await APIUpdater.APIModel.findOne({}), series: series })
})