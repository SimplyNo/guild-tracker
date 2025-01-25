import mongoose, { Document, Model } from "mongoose";
import { HypixelGuildResponse, TrackedGuild, TrackedGuildSchema } from "../schemas/Guild";
import { EventEmitter } from "events";
import { Util } from "../util/Util";
import chalk from "chalk";
import { Wrappers } from "../wrappers/Wrappers";
import { ObjectId } from "mongodb";
export class GuildTracker extends EventEmitter {
    public readonly updateIntervalSeconds = 1;
    public readonly minCacheAge = 10 * 60 * 1000;
    public currentlyUpdating = false;
    public currentUpdateGroup = 0;
    // the update order will be 0, 1, 2, etc so that the top 100 guilds are updated more often
    // 0: 1-100
    // 1: 100-10000
    // 2: everyone else
    public readonly updateScheme = [0, 2, 2, 2, 1, 2, 2, 2, 1]
    public updateIntervalID: NodeJS.Timeout | null = null;
    constructor(public APIModel: Model<TrackedGuild>) {
        super()
    }
    public start() {
        this.emit('start', this);
        this.updateIntervalID = setInterval(async () => {
            if (this.currentlyUpdating) return;
            this.updateNextGuild();
        }, this.updateIntervalSeconds * 1000)
    }
    public async updateNextGuild() {
        this.currentlyUpdating = true;
        const nextGuild = await this.getNextGuild();
        // console.log('Updating a guild...', nextGuild)
        if (nextGuild && (nextGuild.lastUpdated.getTime() + this.minCacheAge) < Date.now()) {
            const hypixelData = await Wrappers.hypixel.guild(nextGuild._id.toString(), 'id', { updateAPI: false }).catch(e => {
                return e.error === 'notfound' ? ({ notfound: true }) : null
            });
            if (hypixelData) {
                if ((hypixelData as { notfound: true }).notfound) {
                    console.warn(`Guild ${nextGuild.name} not found! Deleting...`)
                    await this.APIModel.deleteOne({ _id: nextGuild._id });
                } else {
                    await this.updateGuild(hypixelData as HypixelGuildResponse<false>);
                }
            }
        }
        this.currentlyUpdating = false;
    }
    private async getNextGuild() {
        // might be best to compile a leaderboard first so that it doesn't have to sort every time?
        let allGuilds = await this.APIModel.find({}, {}, { sort: { 'exp': -1 } }).select({ lastUpdated: 1, name: 1 }).lean();

        this.currentUpdateGroup = this.currentUpdateGroup === (this.updateScheme.length - 1) ? 0 : this.currentUpdateGroup + 1;
        const nextGroup = this.updateScheme[this.currentUpdateGroup];
        if (nextGroup === 0) {
            // the last updated guild of top 100 guilds by gexp
            return allGuilds.slice(0, 100).sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime())[0];
        } else if (nextGroup === 1) {
            // the last updated guild of top 10000 guilds by gexp
            return allGuilds.slice(100, 10000).sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime())[0];
        } else {
            // the last updated guild of all guilds
            return allGuilds.slice(10000).sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime())[0];
        }

        // return this.APIModel.findOne({}, {}, { sort: { 'lastUpdated': 1 } })
    }
    public async updateGuild(hypixelData: HypixelGuildResponse<false | true>) {
        let { _id, name, created, tag, tagColor, exp, level, members, ranks, guildExpByGameType, achievements, chatMute, coins, coinsEver, description, error, name_lower, preferredGames, publiclyListed } = hypixelData;
        /**
         * TODO: Update guild:
         * 1. Get guild from API (hypixelData)
         * 2. Get guild from DB
         * 3. Compare guilds
         * 4. Update guild in DB (populate members historical etc)
         * 5. Save guild in DB
        */
        const trackedGuild = await this.APIModel.findOne({ _id: hypixelData._id });
        console.log(chalk.red(`(${this.updateScheme[this.currentUpdateGroup]}) Updating guild: `) + chalk.hex(hypixelData.tagColor?.hex || '#808080').visible(`${hypixelData.name} [${hypixelData.tag}]`) + chalk.grey(` Last Updated: ${Util.getDateString(Math.abs(Date.now() - (trackedGuild?.lastUpdated.getTime() || 0)))}`));
        if (!trackedGuild) {
            // add Guild
            console.log(`Not Tracked!`)
            await this.addGuild(hypixelData);
        } else {
            Object.assign(trackedGuild, this.getUpdatedData(trackedGuild, hypixelData));
            await this.APIModel.findOneAndUpdate({ _id: hypixelData._id }, trackedGuild)
            // await trackedGuild.save();
        }
    }
    public async addGuild(hypixelData: HypixelGuildResponse<false | true>) {
        if (hypixelData.error) return;
        /**
         * ((value: APIGuildMember & { weekly: number; }, index: number, array: (APIGuildMember & { weekly: number; })[]) => unknown) & ((value: APIGuildMember & { ...; }, index: number, array: (APIGuildMember & { ...; })[]) => unknown)
        */
        const guild = new this.APIModel({ ...this.getUpdatedData({}, hypixelData), firstUpdated: new Date() });
        guild._id = new mongoose.Types.ObjectId(hypixelData._id);
        await guild.save();
        console.log(chalk.green('Added guild: ') + chalk.red(guild.name) + chalk.grey(` members: ${hypixelData.members.length} | level: ${hypixelData.level.toFixed(2)}`));
    }
    private getUpdatedData(savedData: Partial<TrackedGuild>, newData: HypixelGuildResponse<true | false>) {
        let { _id, name, created, tag, tagColor, exp, level, members, ranks, guildExpByGameType, achievements, chatMute, coins, coinsEver, description, error, name_lower, preferredGames, publiclyListed } = newData;

        if (!savedData.allMembers) savedData.allMembers = [];
        if (!savedData.expHistory) savedData.expHistory = [];
        if (!savedData.recentExpHistory) savedData.recentExpHistory = [];
        savedData.expHistory.push([Date.now(), exp]);
        savedData.recentExpHistory.push([Date.now(), exp]);
        /** 
         *  Attempt to save space by only saving 1 expHistory extry per day.
         */
        const lastElements = new Map();

        savedData.expHistory.forEach(([timestamp, value]) => {
            // Extract the date (year-month-day) from the timestamp
            const date = new Date(timestamp).toISOString().split('T')[0];

            // Update the Map with the latest element for the day
            lastElements.set(date, [timestamp, value]);
        });

        // Convert the Map back to an array of values
        savedData.expHistory = Array.from(lastElements.values());

        // make recentExpHistory only have elements where the timestamp is within the last 10 days
        savedData.recentExpHistory = savedData.recentExpHistory.filter(([timestamp]) => (Date.now() - timestamp) < 10 * 24 * 60 * 60 * 1000);

        savedData.exp = exp;
        savedData.name = name;
        savedData.name_lower = name_lower;
        savedData.created = created;
        savedData.chatMute = chatMute;
        savedData.coins = coins;
        savedData.coinsEver = coinsEver;
        savedData.description = description;
        savedData.guildExpByGameType = new Map(Object.entries(guildExpByGameType));
        savedData.ranks = ranks;
        savedData.tag = tag;
        savedData.tagColor = tagColor?.color;
        savedData.achievements = achievements;
        savedData.preferredGames = preferredGames;
        savedData.publiclyListed = publiclyListed;

        // update old guilds
        savedData.firstUpdated = savedData.expHistory[0][0];
        // todo: see who left and set inGuild to false
        const membersWhoLeft = savedData.allMembers.filter(m => m.inGuild && !members.find(e => e.uuid === m.uuid));
        for (const memberWhoLeft of membersWhoLeft) {
            memberWhoLeft.inGuild = false;
            memberWhoLeft.leftEstimate = {
                estimateMin: savedData.lastUpdated,
                estimateMax: new Date()
            };
        }
        for (const member of members) {
            const trackedMember = savedData.allMembers.find(m => m.uuid === member.uuid);
            const { expHistory, joined, questParticipation, rank, uuid, weekly } = member;


            if (!trackedMember) {
                savedData.allMembers.push({
                    expHistory: new Map(Object.entries(expHistory)),
                    uuid,
                    inGuild: true,
                    joined: new Date(joined),
                    questParticipation,
                    rank
                });
            } else {
                for (const [date, exp] of Object.entries(member.expHistory)) {
                    trackedMember.expHistory.set(date, exp);
                    trackedMember.inGuild = true;
                }
            }
        }
        savedData.lastUpdated = new Date();
        return savedData;

    }
}