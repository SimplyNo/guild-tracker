
import { version, mongoURI } from "../config.json";
import Redis from "ioredis";
export const redis = new Redis();
import { Wrappers } from "./wrappers/Wrappers";
import mongoose, { model, mongo } from "mongoose";
import { TrackedGuildSchema } from "./schemas/Guild";
import { GuildTracker } from "./updater/Updater";
import express from "express";

console.log([
    `==========================================================`,
    `============== Starting Guild Tracker v${version} =============`,
    `==================== Created by SimplyNo =================`,
    `==========================================================`].join('\n'));
mongoose.connect(mongoURI);
const TrackedGuildModel = model('guilds_tracked', TrackedGuildSchema);
export const APIUpdater = new GuildTracker(TrackedGuildModel);
APIUpdater.on('start', updater => {
    console.log('Guild Tracker Started!')
})
APIUpdater.start();

APIUpdater.APIModel.findOne({}).then(e => console.log(e?.expHistory)).catch(e => console.error('error?!', e))


const app = express();
app.set('view engine', 'ejs');
app.get('/', async (req, res) => {
    const guilds = await APIUpdater.APIModel.find({}).limit(4).lean();
    const series = guilds.map(g => {
        return {
            name: g?.name,
            data: g?.expHistory.slice(-100)
        }
    })
    return res.render('index.ejs', { guilds: await APIUpdater.APIModel.findOne({}), series: series })
})
app.get('/guild/:id', async (req, res) => {
    const guild = await Wrappers.hypixel.guild(req.params.id, 'name', { updateAPI: true }).catch(e => e);
    if (!guild) return res.status(400).json({ error: guild.error || 'API Error', message: guild.message || 'No message provided' });
    return res.json(guild);
})
app.get('/tracked/:name', async (req, res) => {
    const tracked = await APIUpdater.APIModel.findOne({ name_lower: req.params.name.toLowerCase() }).catch(e => null);
    if (tracked) return res.json(tracked);
    return res.json({ error: 'untracked', message: 'That guild is not tracked.' })
})
app.listen(3000, () => {
})


// Wrappers.hypixel.guild("Rawr", "name")
// Wrappers.hypixel.guild("The Dawns Awakening", "name")
// Wrappers.hypixel.guild("Dominance", "name")
// Wrappers.hypixel.guild("Sailor Moon", "name")
// Wrappers.hypixel.guild("The Abyss", "name")
// Wrappers.hypixel.guild("Leman", "name")
// Wrappers.hypixel.guild("Puffy", "name")
// Wrappers.hypixel.guild("Electus", "name")
// Wrappers.hypixel.guild("Les Gaulois", "name")
// Wrappers.hypixel.guild("The Blood Lust", "name")
// Wrappers.hypixel.guild("Miscellaneous", "name")
// Wrappers.hypixel.guild("Blight", "name")
// Wrappers.hypixel.guild("Extorious", "name")
// Wrappers.hypixel.guild("Effusion", "name")
// Wrappers.hypixel.guild("The Crimson", "name")
// Wrappers.hypixel.guild("FushkaArmy", "name")
// Wrappers.hypixel.guild("Lucid", "name")
// Wrappers.hypixel.guild("Lucid Vanillemilch", "name")
// Wrappers.hypixel.guild("Reliable", "name")
// Wrappers.hypixel.guild("Rebel", "name")