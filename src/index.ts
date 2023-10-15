
import { version, mongoURI } from "../config.json";
import Redis from "ioredis";
export const redis = new Redis();
import { Wrappers } from "./wrappers/Wrappers";
import mongoose, { model, mongo } from "mongoose";
import { TrackedGuildSchema } from "./schemas/Guild";
import { GuildTracker } from "./updater/Updater";
import express from "express";
import { Util } from "./util/Util";
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

// console log length of collection
APIUpdater.APIModel.countDocuments({}).then(c => console.log(`Guilds tracked: ${c}`));
const app = express();
app.set('view engine', 'ejs');
app.get('/', async (req, res) => {
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
app.get('/level', async (req, res) => {
    const guilds = await APIUpdater.APIModel.find({}).sort({ exp: -1 }).limit(10).lean();
    const series = guilds.map(g => {
        return {
            name: g?.name,
            data: g?.expHistory.slice(-10000)
        }
    })
    return res.render('level.ejs', { guilds: await APIUpdater.APIModel.findOne({}), series: series })
})
app.get('/guild/:id', async (req, res) => {
    const guild = await Wrappers.hypixel.guild(req.params.id, 'name', { updateAPI: true }).catch(e => e);
    if (!guild) return res.status(400).json({ error: guild.error || 'API Error', message: guild.message || 'No message provided' });
    const tracked = await APIUpdater.APIModel.exists({ _id: guild._id }).catch(e => null);
    if (guild.error) {
        return res.status(400).json(guild);
    } else {
        return res.json({ tracked: !!tracked, ...guild });
    }
})
app.get('/player/:id', async (req, res) => {
    const guild = await Wrappers.hypixel.guild(req.params.id, 'player', { updateAPI: true }).catch(e => e);
    if (!guild) return res.status(400).json({ error: guild.error || 'API Error', message: guild.message || 'No message provided' });
    const tracked = await APIUpdater.APIModel.exists({ _id: guild._id }).catch(e => null);
    if (guild.error) {
        return res.status(400).json(guild);
    } else {
        return res.json({ tracked: !!tracked, ...guild });
    }
})
app.get('/tracked/:name', async (req, res) => {
    const tracked = await APIUpdater.APIModel.findOne({ name_lower: req.params.name.toLowerCase() }).catch(e => null);
    if (tracked) return res.json(tracked);
    return res.json({ error: 'untracked', message: 'That guild is not tracked.' })
})
app.listen(8080, () => {
    console.log('Listening on port 8080');
});

// async function addGuilds() {
//     const { default: dump }: any = await import('../assets/guildIDs.json');
//     // adding the list of guilds to track:
//     console.log(`adding guilds length`, dump.length)
//     for (let i = 0; i < dump.length; i++) {
//         const guildID = dump[i].id;
//         const tracked = await APIUpdater.APIModel.exists({ _id: guildID }).catch(e => null);
//         console.log(`${i}/${dump.length} - ${guildID} - ${!!tracked}`)
//         if (i < 60918) continue;
//         if (!tracked) {
//             await Wrappers.hypixel.guild(guildID, 'id').catch(e => null);
//             await Util.wait(1000);
//         }
//     }
// }
// addGuilds()
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
