import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";

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
        await portfolio.positions.populate("openingOrders");
        await portfolio.positions.populate("closingOrders");
        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getPortfolio broke and raised ${err}`);
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
        await portfolio.positions.populate("openingOrders");
        await portfolio.positions.populate("closingOrders");
        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getClosedPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

export { getClosedPositions, getPendingOrders, getOpenPositions };
