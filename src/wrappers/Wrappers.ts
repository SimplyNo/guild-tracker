import ashconPlayer from './ashcon/ashconPlayer';
import hypixelGuild from './hypixel/guild';
import hypixelPlayer from './hypixel/player';
import hypixelStatus from './hypixel/status';
import mojangPlayer from './mojang/mojangPlayer';
import mojangProfile from './mojang/mojangProfile';
import mojangBulkPlayers from './mojang/mojangBulkPlayers';
import shiiyuSkyblock from './shiiyu/shiiyuSkyblock';
import senitherSkyblock from './senither/senitherSkyblock';
import hypixelleaderboard from './hypixel/leaderboard';
export class Wrappers {
    public static hypixel = {
        guild: hypixelGuild,
        player: hypixelPlayer,
        status: hypixelStatus,
        leaderboard: hypixelleaderboard
    }
    public static mojang = {
        player: mojangPlayer,
        profile: mojangProfile,
        bulkPlayers: mojangBulkPlayers
    }
    public static ashcon = {
        player: ashconPlayer
    }
    public static shiiyu = {
        skyblock: shiiyuSkyblock
    }
    public static senither = {
        skyblock: senitherSkyblock
    }
}