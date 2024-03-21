import { Router } from "express";
import { APIUpdater } from "../..";
import { Wrappers } from "../../wrappers/Wrappers";

export const playerRouter = Router();
playerRouter.get('/api/player/:id', async (req, res) => {
    const guild = await Wrappers.hypixel.guild(req.params.id, 'player', { updateAPI: true }).catch(e => e);
    if (!guild) return res.status(400).json({ error: guild.error || 'API Error', message: guild.message || 'No message provided' });
    const tracked = await APIUpdater.APIModel.exists({ _id: guild._id }).catch(e => null);
    if (guild.error) {
        return res.status(400).json(guild);
    } else {
        return res.json({ tracked: !!tracked, ...guild });
    }
})