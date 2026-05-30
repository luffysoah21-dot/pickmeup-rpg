import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import battlesRouter from "./battles";
import leaderboardRouter from "./leaderboard";
import summonRouter from "./summon";
import heroesRouter from "./heroes";
const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(battlesRouter);
router.use(leaderboardRouter);
router.use(summonRouter);
router.use("/heroes", heroesRouter);
export default router;
