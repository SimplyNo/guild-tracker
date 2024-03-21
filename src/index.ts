
import { version, mongoURI } from "../config.json";
import Redis from "ioredis";
export const redis = new Redis();
import { Wrappers } from "./wrappers/Wrappers";
import mongoose, { model, mongo } from "mongoose";
import { TrackedGuild, TrackedGuildSchema, TrackedMember } from "./schemas/Guild";
import { GuildTracker } from "./updater/Updater";
import express from "express";
import { Util } from "./util/Util";
import { routes } from "./routes";
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
// console.log(`debug. guilds tracked: ???`)
export const App = express();

App.set('view engine', 'ejs');
App.use('/', routes);
App.listen(8080, () => {
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
