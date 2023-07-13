import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";
import TradeSummaryModel from "../models/TradeSummary.js";

async function getPendingOrders(req, res) {
    try {
        const userId = req.user.id;

        const orders = await Order.find({
            user: userId,
            orderType: "limit",
            filledStatus: "pending",
        });
        res.status(200).json(orders);
    } catch (err) {
        console.error(`Function getPendingOrders broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

async function getOpenPositions(req, res) {
    try {
        const userId = req.user.id;

        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "open" },
        });
        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            res.status(200).json([]);
            return;
        }

        portfolio = await PortfolioModel.populate(portfolio, {
            path: "positions.openingOrders",
        });

        portfolio = await PortfolioModel.populate(portfolio, {
            path: "positions.closingOrders",
        });

        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getOpenPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

async function getClosedPositions(req, res) {
    try {
        const userId = req.user.id;

        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "closed" },
        });
        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            res.status(200).json([]);
            return;
        }

        portfolio = await PortfolioModel.populate(portfolio, {
            path: "positions.openingOrders",
        });

        portfolio = await PortfolioModel.populate(portfolio, {
            path: "positions.closingOrders",
        });

        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getClosedPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

async function getTodaysOpenPositions(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tradeSummary = await TradeSummaryModel.findOne({
        user: userId,
        date: {
            $gte: today,
            $lt: tomorrow,
        },
    });

    return tradeSummary ? tradeSummary.number_of_open_positions : 0;
}

async function getThisMonthOpenPositions(userId) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const tradeSummaries = await TradeSummaryModel.find({
        user: userId,
        date: {
            $gte: firstDayOfMonth,
            $lt: firstDayOfNextMonth,
        },
    });

    return tradeSummaries.reduce(
        (sum, tradeSummary) => sum + tradeSummary.number_of_open_positions,
        0
    );
}

async function getTodaysClosedPositions(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tradeSummary = await TradeSummaryModel.findOne({
        user: userId,
        date: {
            $gte: today,
            $lt: tomorrow,
        },
    });

    return tradeSummary ? tradeSummary.number_of_closed_positions : 0;
}

async function getThisMonthClosedPositions(userId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 });
    const firstDayOfMonth = new Date(year, now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(year, now.getMonth() + 1, 1);

    const tradeSummaries = await TradeSummaryModel.find({
        user: userId,
        date: {
            $gte: firstDayOfMonth,
            $lt: firstDayOfNextMonth,
        },
    });

    return tradeSummaries.reduce(
        (sum, tradeSummary) => sum + tradeSummary.number_of_closed_positions,
        0
    );
}

export {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
    getTodaysOpenPositions,
    getThisMonthOpenPositions,
    getTodaysClosedPositions,
    getThisMonthClosedPositions,
};
