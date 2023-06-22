import mongoose, { Document, Model } from "mongoose";
import { HypixelGuildResponse, TrackedGuild, TrackedGuildSchema } from "../schemas/Guild";
import { EventEmitter } from "events";
import { Util } from "../util/Util";
import chalk from "chalk";
import { Wrappers } from "../wrappers/Wrappers";
import { ObjectId } from "mongodb";
export class GuildTracker extends EventEmitter {
    public readonly updateIntervalSeconds = 2;
    public readonly minCacheAge = 10 * 60 * 1000;
    public currentlyUpdating = false;
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
        const nextGuild = await this.getNextGuild().catch(e => null);
        if (nextGuild && (nextGuild.lastUpdated.getTime() + this.minCacheAge) < Date.now()) {
            const hypixelData = await Wrappers.hypixel.guild(nextGuild._id.toString(), 'id', { updateAPI: false }).catch(e => null);
            if (hypixelData) {
                await this.updateGuild(hypixelData);
            }
        }
        this.currentlyUpdating = false;
    }
    private async getNextGuild() {
        // TODO: Get next guild sorted by last updated
        return this.APIModel.findOne({}, {}, { sort: { 'lastUpdated': 1 } })
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
        console.log(chalk.red('Updating guild: ') + chalk.hex(hypixelData.tagColor?.hex || '#808080').visible(`${hypixelData.name} [${hypixelData.tag}]`));
        if (!trackedGuild) {
            // add Guild
            console.log(`Not Tracked!`)
            this.addGuild(hypixelData);
        } else {
            Object.assign(trackedGuild, this.getUpdatedData(trackedGuild, hypixelData));
            trackedGuild.save();
        }
    }
    public addGuild(hypixelData: HypixelGuildResponse<false | true>) {
        if (hypixelData.error) return;
        /**
         * ((value: APIGuildMember & { weekly: number; }, index: number, array: (APIGuildMember & { weekly: number; })[]) => unknown) & ((value: APIGuildMember & { ...; }, index: number, array: (APIGuildMember & { ...; })[]) => unknown)
        */
        const guild = new this.APIModel(this.getUpdatedData({}, hypixelData));
        guild._id = new mongoose.Types.ObjectId(hypixelData._id);
        guild.save();
        console.log(chalk.green('Added guild: ') + chalk.red(guild.name));
    }
    private getUpdatedData(savedData: Partial<TrackedGuild>, newData: HypixelGuildResponse<true | false>) {
        let { _id, name, created, tag, tagColor, exp, level, members, ranks, guildExpByGameType, achievements, chatMute, coins, coinsEver, description, error, name_lower, preferredGames, publiclyListed } = newData;

        if (!savedData.allMembers) savedData.allMembers = [];
        if (!savedData.expHistory) savedData.expHistory = [];
        savedData.expHistory.push([Date.now(), exp]);
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
        savedData.lastUpdated = new Date();

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
                }
            }
        }
        return savedData;

    }
}