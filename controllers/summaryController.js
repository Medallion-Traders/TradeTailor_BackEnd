import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";
import TradeSummaryModel from "../models/TradeSummary.js";
import { getCurrentPrice } from "../utils/queryWebSocket.js";
import { emitUpdate } from "../utils/socket.js";

async function getPendingOrders(req, res) {
    try {
        const userId = req.user.id;

        const orders = await Order.find({
            user: userId,
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
            populate: [{ path: "openingOrders" }, { path: "closingOrders" }],
        });

        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            res.status(200).json([]);
            return;
        }

        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getClosedPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

async function getClosedPositions(req, res) {
    try {
        const userId = req.user.id;

        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "closed" },
            populate: [{ path: "openingOrders" }, { path: "closingOrders" }],
        });

        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            res.status(200).json([]);
            return;
        }

        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getClosedPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

//-------------------------START OF WEBSOCKET FUNCTIONS----------------------------//

//------------------------START OF SELECTIVE EMIT FUNCTIONS------------------------//

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

    emitUpdate(
        "getTodaysOpenPositions",
        tradeSummary ? tradeSummary.number_of_open_positions : 0,
        userId
    );
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

    emitUpdate(
        "getThisMonthOpenPositions",
        tradeSummaries.reduce(
            (sum, tradeSummary) => sum + tradeSummary.number_of_open_positions,
            0
        ),
        userId
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

    emitUpdate(
        "getTodaysClosedPositions",
        tradeSummary ? tradeSummary.number_of_closed_positions : 0,
        userId
    );
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

    emitUpdate(
        "getThisMonthClosedPositions",
        tradeSummaries.reduce(
            (sum, tradeSummary) => sum + tradeSummary.number_of_closed_positions,
            0
        ),
        userId
    );
}

async function getRealisedProfits(userId) {
    let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
        path: "positions",
    });
    if (!portfolio) {
        console.log(`No portfolio found for user ${userId}`);
        return 0;
    }

    emitUpdate(
        "getRealisedProfits",
        portfolio.positions.reduce((sum, position) => sum + position.profit, 0),
        userId
    );
}

//------------------------START OF CONSTANT EMIT FUNCTIONS------------------------//

async function getUnrealisedProfits(userId) {
    try {
        let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
            match: { positionStatus: "open" },
        });
        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            return 0;
        }

        let totalUnrealisedProfits = 0;
        for (const position of portfolio.positions) {
            const current_price = await getCurrentPrice(position.symbol);
            console.log(position.symbol, current_price);
            if (position.positionType === "long") {
                totalUnrealisedProfits += current_price - position.averagePrice * position.quantity;
            } else {
                totalUnrealisedProfits += position.averagePrice * position.quantity - current_price;
            }
        }
        return totalUnrealisedProfits;
    } catch (err) {
        console.log(`Error fetching unrealised profits for user ${userId}`);
        console.log(err);
    }
}

async function getPortfolioValue(userId) {
    let portfolio = await PortfolioModel.findOne({ user: userId }).populate({
        path: "positions",
        match: { positionStatus: "open" },
    });
    if (!portfolio) {
        console.log(`No portfolio found for user ${userId}`);
        return 0;
    }

    let totalValue = 0;
    for (const position of portfolio.positions) {
        const current_price = await getCurrentPrice(position.symbol);
        if (position.positionType === "long") {
            totalValue += current_price * position.quantity;
        } else {
            const profit = position.averagePrice * position.quantity - current_price;
            //Profit/Loss of short position is deducted from total value
            //The value of the short position does not exist in real terms as it on margin
            totalValue += profit;
        }
    }
    console.log(totalValue);
    return totalValue;
}

export {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
    getTodaysOpenPositions,
    getThisMonthOpenPositions,
    getTodaysClosedPositions,
    getThisMonthClosedPositions,
    getRealisedProfits,
    getUnrealisedProfits,
    getPortfolioValue,
};
