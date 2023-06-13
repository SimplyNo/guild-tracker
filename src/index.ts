
import { version } from "../config.json";
import Redis from "ioredis";
export const redis = new Redis();
import { Wrappers } from "./wrappers/Wrappers";

console.log([
    `==========================================================`,
    `============== Starting Guild Tracker v${version} =============`,
    `==================== Created by SimplyNo =================`,
    `==========================================================`].join('\n'));
