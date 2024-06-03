import { APIUpdater } from "../..";
import { TrackedMember } from "../../schemas/Guild";
import { Wrappers } from "../../wrappers/Wrappers";
import { Router } from "express";
export const guildRouter = Router();

guildRouter.get('/api/guild/:id', async (req, res) => {
    const options = {
        type: <'player' | 'name' | 'id'>req.query.type || 'name',
        parseNames: <string>req.query.parseNames || false,
        force: <string>req.query.force || false
    }
    const opts = {
        updateAPI: true,
        parseNames: new Boolean(options.parseNames).valueOf(),
        cache: !(new Boolean(options.force).valueOf())
    };
    console.log('opts:', opts)
    const guild = await Wrappers.hypixel.guild(req.params.id, options.type, opts).catch((e: ({ error: string, message: string })) => e).then(e => e);
    if (!('_id' in guild)) return res.status(400).json({ error: guild.error || 'API Error', message: guild.message || 'No message provided' });


    const tracked = await APIUpdater.APIModel.exists({ _id: guild._id }).catch(e => null);


    return res.json({ tracked: !!tracked, ...guild });
})