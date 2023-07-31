import cron from "node-cron";
import { getCurrentMarketStatus } from "../utils/queryWebSocket.js";
import { fillOrder, isMarketOpen, updateMarketStatus } from "../utils/queryDB.js";
import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";
import UserModel from "../models/Users.js";
import DailyProfitModel from "../models/Profit.js";
import AlertModel from "../models/Alert.js";

export async function fetchMarketStatus() {
    let usMarketStatus = await getCurrentMarketStatus();
    updateMarketStatus(usMarketStatus);
}

export async function checkMarketStatusAndFillOrders() {
    ////console.log("Checking market status and filling orders");
    ////console.log(isMarketOpenFunc(uniqueTime));
    //console.log(isMarketOpen());
    if (!isMarketOpen()) {
        return;
    }
    const orders = await Order.find({
        filledStatus: "pending",
    });

    const promises = orders.map(async (order) => {
        const { doesUserHaveEnoughBalance, isFilled, price } = await fillOrder(order);
        let alert;
        if (!doesUserHaveEnoughBalance) {
            alert = new AlertModel({
                user: order.user,
                message: `Your ${order.orderType} order for ${order.symbol} has been cancelled due to insufficient funds`,
                isSeen: false,
            });
            await Order.findByIdAndDelete(order._id);
        } else if (isFilled) {
            alert = new AlertModel({
                user: order.user,
                message: `Your ${order.orderType} order for ${order.symbol} has been filled at ${price}`,
                isSeen: false,
            });
        } else {
            //Do nothing
        }
        await alert.save();
    });

    await Promise.all(promises);
}

export async function snapshotProfits() {
    const dateToday = new Date().toISOString().split("T")[0];

    const users = await UserModel.find({});

    for (const user of users) {
        let totalProfits;
        let portfolio = await PortfolioModel.findOne({
            user: user._id,
        }).populate({
            path: "positions",
        });

        if (!portfolio) {
            //console.log(`No portfolio found for user ${user.username}`);
            totalProfits = 0;
        } else {
            totalProfits = portfolio.positions.reduce((sum, position) => sum + position.profit, 0);
        }

        const dailyProfit = new DailyProfitModel({
            user: user._id,
            date: dateToday,
            profit: totalProfits,
        });

        await dailyProfit.save();
    }
}

function startCrons() {
    cron.schedule("9 6 * * * *", fetchMarketStatus, {
        timezone: "Asia/Singapore",
    });

    cron.schedule("*/5 * * * * *", checkMarketStatusAndFillOrders, {
        timezone: "Asia/Singapore",
    });

    cron.schedule("5 6 * * *", snapshotProfits, {
        timezone: "Asia/Singapore",
    });
}

export default startCrons;
