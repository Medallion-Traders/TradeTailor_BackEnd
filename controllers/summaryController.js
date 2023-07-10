import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";

async function getPendingOrders(userId) {
    try {
        const orders = await Order.find({
            user: userId,
            orderType: "limit",
            filledStatus: "pending",
        });
        return orders;
    } catch (err) {
        console.error(`Function getPendingOrders broke and raised ${err}`);
    }
}

async function getOpenPositions(userId) {
    try {
        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "open" },
        });
        return portfolio.positions;
    } catch (err) {
        console.error(`Function getPortfolio broke and raised ${err}`);
    }
}

async function getClosedPositions(userId) {
    try {
        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "closed" },
        });
        return portfolio.positions;
    } catch (err) {
        console.error(`Function getClosedPositions broke and raised ${err}`);
    }
}

export { getClosedPositions, getPendingOrders, getOpenPositions };
