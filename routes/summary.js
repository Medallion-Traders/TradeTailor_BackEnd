import express from "express";
import {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
    getTodaysOpenPositions,
    getTodaysClosedPositions,
    getThisMonthClosedPositions,
    getThisMonthOpenPositions,
} from "../controllers/summaryController.js";

const summary = express.Router();

summary.get("/pending-orders", getPendingOrders);
summary.get("/open-positions", getOpenPositions);
summary.get("/closed-positions", getClosedPositions);
summary.get("/todays-open-positions", getTodaysOpenPositions);
summary.get("/todays-closed-positions", getTodaysClosedPositions);
summary.get("/this-month-open-positions", getThisMonthOpenPositions);
summary.get("/this-month-closed-positions", getThisMonthClosedPositions);

export default summary;
