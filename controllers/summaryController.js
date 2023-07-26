import { Order } from "../models/Order.js";
import UserModel from "../models/Users.js";
import PortfolioModel from "../models/Portfolio.js";
import TradeSummaryModel from "../models/TradeSummary.js";
import { getCurrentPrice } from "../utils/queryWebSocket.js";
import { emitUpdate } from "../utils/socket.js";
import SnapshotModel from "../models/Snapshot.js";

async function getPendingOrders(req, res) {
    try {
        const userId = req.user.id;

        const orders = await Order.find({
            user: userId,
            filledStatus: "pending",
        });
        // console.log("orders", orders);
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

const fetchRealisedProfits = async (req, res) => {
    try {
        const userId = req.user.id;

        const portfolio = await PortfolioModel.findOne({ user: userId }).populate({
            path: "positions",
        });

        if (!portfolio) {
            return res.status(404).json({ message: `No portfolio found for user ${userId}` });
        }

        const result = portfolio.positions.reduce((sum, position) => sum + position.profit, 0);

        res.status(200).json({ profits: result });
    } catch (error) {
        console.error(`Error fetching realised profits for user ${userId}: ${error}`);
        res.status(500).json({ message: `Server error occurred: ${error}` });
    }
};

async function getLeaderboard(req, res) {
    try {
        const portfolios = await PortfolioModel.find({})
            .populate({
                path: "positions",
            })
            .populate("user");

        if (!portfolios) {
            return res.status(404).json({ message: "No portfolios found" });
        }

        let leaderboard = portfolios.map((portfolio) => ({
            id: portfolio.user._id,
            username: portfolio.user.username,
            profits: portfolio.positions.reduce((sum, position) => sum + position.profit, 0),
        }));

        leaderboard.sort((a, b) => b.profits - a.profits);

        // Add rank to each user in the leaderboard
        leaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1,
        }));

        const currentUserId = req.user.id;

        let currentUserData = leaderboard.find((user) => String(user.id) === String(currentUserId));

        if (!currentUserData) {
            // get current user info if they don't have a portfolio
            const currentUser = await UserModel.findById(currentUserId);
            currentUserData = {
                id: currentUserId,
                username: currentUser.username,
                profits: null,
            };
        }

        const currentUserIndex = leaderboard.findIndex((user) => user.id === currentUserId);
        let topUsers;

        if (currentUserIndex < 10) {
            topUsers = leaderboard.slice(0, 10);
        } else {
            topUsers = [...leaderboard.slice(0, 10), leaderboard[currentUserIndex]];
        }

        return res.status(200).json({ topUsers, currentUser: currentUserData });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
}

//-------------------------START OF WEBSOCKET FUNCTIONS----------------------------//

//------------------------START OF SELECTIVE EMIT FUNCTIONS------------------------//

async function getTodaysOpenPositions(userId) {
    const today = new Date();
    const todayUtc = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
        .toISOString()
        .slice(0, 10);

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); // add 24 hours in milliseconds to get tomorrow
    const tomorrowUtc = new Date(
        Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate())
    )
        .toISOString()
        .slice(0, 10);

    //console.log("Today's date is ", new Date(todayUtc));
    //console.log("Tommorow's date is ", new Date(tomorrowUtc));
    const tradeSummary = await TradeSummaryModel.findOne({
        user: userId,
        date: {
            $gte: new Date(todayUtc),
            $lt: new Date(tomorrowUtc),
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
    const firstDayOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        .toISOString()
        .slice(0, 10);
    const firstDayOfNextMonthUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    )
        .toISOString()
        .slice(0, 10);

    const tradeSummaries = await TradeSummaryModel.find({
        user: userId,
        date: {
            $gte: new Date(firstDayOfMonthUtc),
            $lt: new Date(firstDayOfNextMonthUtc),
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
    const todayUtc = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
        .toISOString()
        .slice(0, 10);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowUtc = new Date(
        Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate())
    )
        .toISOString()
        .slice(0, 10);

    const tradeSummary = await TradeSummaryModel.findOne({
        user: userId,
        date: {
            $gte: new Date(todayUtc),
            $lt: new Date(tomorrowUtc),
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
    const firstDayOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        .toISOString()
        .slice(0, 10);
    const firstDayOfNextMonthUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    )
        .toISOString()
        .slice(0, 10);

    const tradeSummaries = await TradeSummaryModel.find({
        user: userId,
        date: {
            $gte: new Date(firstDayOfMonthUtc),
            $lt: new Date(firstDayOfNextMonthUtc),
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
    let result = 0;
    if (!portfolio) {
        console.log(`No portfolio found for user ${userId}`);
        emitUpdate("getRealisedProfits", result, userId);
        return;
    }

    result = portfolio.positions.reduce((sum, position) => sum + position.profit, 0);

    emitUpdate("getRealisedProfits", result, userId);
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
                totalUnrealisedProfits +=
                    (current_price - position.averagePrice) * position.quantity;
            } else {
                totalUnrealisedProfits +=
                    (position.averagePrice - current_price) * position.quantity;
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
//-----------------------INITIALSING CONSTANT EMIT FUNCTIONS-----------------------

async function initializeUnrealisedProfitsAndPortfolioValue(userId) {
    // Attempt to get the snapshot for the user, if it does not exist, new documents with 2 zeros
    let snapshot;
    snapshot = await SnapshotModel.findOne({ user: userId });
    if (!snapshot) {
        snapshot = new SnapshotModel({
            user: userId,
            lastPortfolioValue: 0,
            lastUnrealisedProfit: 0,
        });
        await snapshot.save();
    }

    console.log("Snapshot model , ", snapshot);

    emitUpdate("getUnrealisedProfits", snapshot.lastUnrealisedProfit, userId);
    emitUpdate("getPortfolioValue", snapshot.lastPortfolioValue, userId);
}

async function updateUnrealisedProfitsAndPortfolioValue(userId) {
    const unrealisedProfits = await getUnrealisedProfits(userId);
    const portfolioValue = await getPortfolioValue(userId);

    let snapshot = await SnapshotModel.findOne({ user: userId });
    snapshot.lastUnrealisedProfit = unrealisedProfits;
    snapshot.lastPortfolioValue = portfolioValue;

    await snapshot.save();

    console.log("SNAPSHOT MODEL : ", snapshot);
}

export {
    getClosedPositions,
    getPendingOrders,
    getOpenPositions,
    fetchRealisedProfits,
    getLeaderboard,
    getTodaysOpenPositions,
    getThisMonthOpenPositions,
    getTodaysClosedPositions,
    getThisMonthClosedPositions,
    getRealisedProfits,
    getUnrealisedProfits,
    getPortfolioValue,
    initializeUnrealisedProfitsAndPortfolioValue,
    updateUnrealisedProfitsAndPortfolioValue,
};
