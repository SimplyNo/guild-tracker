import { Router } from "express";
import { guildRouter } from "./api/guild";
import { playerRouter } from "./api/player";
import { trackedRouter } from "./api/tracked";
import { defaultRouter } from "./default";
import { levelRouter } from "./level";
import { searchRouter } from "./api/search";
import { leaderboardRouter } from "./api/leaderboard";
import { memberRouter } from "./api/member";
import { App } from "../..";
import chalk from "chalk";
export const routes = Router();


routes.use((req, res, next) => {
    console.log(`${chalk.green(req.method)} ${req.url}`);
    next();
});
routes.use(defaultRouter);
routes.use(levelRouter);

routes.use(guildRouter);
routes.use(playerRouter);
routes.use(trackedRouter);
routes.use(searchRouter);
routes.use(leaderboardRouter);
routes.use(memberRouter);
// routes.get('/api/', async (req, res) => {
//     res.send(`<h1 style="font-family:arial">Guild Tracker API</h1>
// <ul>
//     <li><a href="/api/guild/:id">/api/guild/:id</a></li>
//     <li><a href="/api/player/:id">/api/player/:id</a></li>
//     <li><a href="/api/tracked/:id">/api/tracked/:id</a></li>
//     <li><a href="/api/search/:name">/api/search/:name</a></li>
//     <li><a href="/api/leaderboard/:id">/api/leaderboard/:id</a></li>
//     <li><a href="/api/member/:name">/api/member/:name
// </ul>`)
// })
