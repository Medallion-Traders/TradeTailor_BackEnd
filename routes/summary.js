import express from "express";
import {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
    fetchRealisedProfits,
    getLeaderboard,
} from "../controllers/summaryController.js";

const summary = express.Router();

summary.get("/pending-orders", getPendingOrders);
summary.get("/open-positions", getOpenPositions);
summary.get("/closed-positions", getClosedPositions);
summary.get("/realised-profits", fetchRealisedProfits);
summary.get("/leaderboard", getLeaderboard);

export default summary;
