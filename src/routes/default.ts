import { Router } from "express";
import { APIUpdater } from "..";

export const defaultRouter = Router();
defaultRouter.get('/', async (req, res) => {
    // console.log("fetch:", req)
    const guilds = await APIUpdater.APIModel.find({}).sort({ exp: -1 }).limit(10).lean();
    const series = guilds.map(g => {
        let gexp: { [date: string]: number } = {}
        g.allMembers.forEach(m => {
            Object.entries(m.expHistory).forEach(([date, exp]) => {
                if (!gexp[date]) gexp[date] = 0;
                gexp[date] += exp;
            })
        })
        return {
            name: g?.name,
            // data: g?.expHistory.slice(-100)

            data: Object.entries(gexp).sort((a, b) => (new Date(a[0]).getTime()) - (new Date(b[0]).getTime()))
        }
    })
    return res.render('index.ejs', { guilds: await APIUpdater.APIModel.findOne({}), series: series })
}) 