import express from "express";
import {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
} from "../controllers/summaryController.js";

const summary = express.Router();

summary.get("/pending-orders", getPendingOrders);
summary.get("/open-positions", getOpenPositions);
summary.get("/closed-positions", getClosedPositions);

export default summary;
