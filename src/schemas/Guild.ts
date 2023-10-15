import { InferSchemaType, Schema, SchemaTypes } from "mongoose";

interface APIGuildMember {
    uuid: string,
    rank: string,
    joined: number,
    questParticipation: number,
    expHistory: {
        [date: string]: number
    }
}
interface APIRank {
    name: string,
    default: boolean,
    tag: string,
    created: number,
    priority: number
}
interface APIGuildData {
    _id: string,
    name: string,
    name_lower: string,
    coins: number,
    coinsEver: number,
    created: number,
    members: APIGuildMember[],
    ranks: APIRank[],
    preferredGames: string[],
    achievements: {
        EXPERIENCE_KINGS: number,
        WINNERS: number,
        ONLINE_PLAYERS: number,
    },
    exp: number,
    tagColor: string,
    tag: string,
    description: string,
    chatMute: string,
    publiclyListed: boolean,
    guildExpByGameType: {
        [k: string]: number
    }
}
interface WrappedGuildData<parseNames> extends Omit<APIGuildData, 'tagColor'> {
    error: null;
    cached: boolean;
    level: number;
    members: (APIGuildMember & { weekly: number, username: parseNames extends true ? string : null })[],
    tagColor?: { code: string, hex: string, color: string }
}
export type HypixelGuildResponse<parseNames extends Boolean> = (WrappedGuildData<parseNames>);

export const TrackedGuildSchema = new Schema({
    lastUpdated: { type: Date, required: true, default: () => new Date(), index: -1 },
    name: { type: String, default: "an-unnamed-guild" },
    name_lower: { type: String, default: "an-unnamed-guild", lowercase: true },
    coins: { type: Number, required: true, default: 0 },
    coinsEver: { type: Number, required: true, default: 0 },
    created: { type: Number, required: true },
    exp: { type: Number, default: 0, index: -1 },
    expHistory: {
        type: [SchemaTypes.Mixed],
        validate: {
            validator: (v) => {
                return Array.isArray(v) || (parseInt(v[0]) && parseInt(v[1]));
            },
            message: v => `${JSON.stringify(v.value)} is not a valid EXP Data point. Valid is [Date, Number]`
        },
        required: true
    },

    /**
     * All guild members including those who have left!
     */
    allMembers: [{
        _id: false,
        inGuild: { type: Boolean, required: true },
        leftEstimate: { estimateMax: { type: Date }, estimateMin: { type: Date } },
        uuid: { type: String, required: true },
        rank: { type: String },
        joined: { type: Date, required: true },
        questParticipation: { type: Number },
        expHistory: { type: Map, of: Number, required: true },
    }],
    ranks: [{
        _id: false,
        name: { type: String, required: true },
        default: { type: Boolean, required: true, default: false },
        tag: { type: String },
        created: { type: Number, required: true },
        priority: { type: Number, required: true },
    }],
    preferredGames: { type: [String] },
    achievements: {
        EXPERIENCE_KINGS: { type: Number },
        WINNERS: { type: Number },
        ONLINE_PLAYERS: { type: Number },
    },
    tagColor: { type: String },
    tag: { type: String },
    description: { type: String },
    chatMute: { type: String },
    publiclyListed: { type: Boolean },
    guildExpByGameType: { type: Map, of: Number, required: true },
});
export type TrackedGuild = InferSchemaType<typeof TrackedGuildSchema>;
