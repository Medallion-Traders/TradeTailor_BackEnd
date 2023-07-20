import cron from "node-cron";
import { getCurrentMarketStatus } from "../utils/queryWebSocket.js";
import { fillOrder, isMarketOpen } from "../utils/queryDB.js";
import { Order } from "../models/Order.js";
import PortfolioModel from "../models/Portfolio.js";
import UserModel from "../models/Users.js";
import DailyProfitModel from "../models/Profit.js";
import AlertModel from "../models/Alert.js";

function startCrons() {
    // Cron job to fetch market status for the day at 6.02 AM Singapore time
    cron.schedule(
        "2 6 * * *",
        async () => {
            usMarketStatus = await getCurrentMarketStatus();
        },
        {
            timezone: "Asia/Singapore",
        }
    );

    // Cron job to check market status every 5 seconds
    cron.schedule(
        "*/5 * * * * *",
        async () => {
            if (!isMarketOpen()) {
                return;
            }

            const orders = await Order.find({ filledStatus: "pending" });

            // Create an array of promises
            const promises = orders.map(async (order) => {
                const { doesUserHaveEnoughBalance } = fillOrder(order);
                let alert;
                if (doesUserHaveEnoughBalance) {
                    alert = new AlertModel({
                        user: order.user,
                        message: `Your ${order.orderType} order for ${order.symbol} has been filled at ${order.unitPrice}`,
                        isSeen: false,
                    });
                } else {
                    alert = new AlertModel({
                        user: order.user,
                        message: `Your ${order.orderType} order for ${order.symbol} has been cancelled due to insufficient funds`,
                        isSeen: false,
                    });
                    //Delete the order
                    await Order.findByIdAndDelete(order._id);
                }
                // Save alert
                await alert.save();
            });

            // Wait for all promises to resolve
            await Promise.all(promises);
        },
        {
            timezone: "Asia/Singapore",
        }
    );

    // Cron job to snapshot the day's total profits at 6.05 Singapore time
    // The date is logged at the end of the trading day
    cron.schedule(
        "5 6 * * *",
        async () => {
            const dateToday = new Date().toISOString().split("T")[0]; // Get the date part in YYYY-MM-DD format

            try {
                // Iterate through all UserModel documents
                const users = await UserModel.find({});

                for (const user of users) {
                    let totalProfits;
                    // Get the total profits for the day
                    let portfolio = await PortfolioModel.findOne({
                        user: user._id,
                    }).populate({
                        path: "positions",
                    });

                    if (!portfolio) {
                        console.log(`No portfolio found for user ${user.username}`);
                        totalProfits = 0;
                    } else {
                        totalProfits = portfolio.positions.reduce(
                            (sum, position) => sum + position.profit,
                            0
                        );
                    }

                    // Create a new DailyProfit document
                    const dailyProfit = new DailyProfitModel({
                        user: user._id,
                        date: dateToday,
                        profit: totalProfits,
                    });

                    // Save the document
                    await dailyProfit.save();
                }
            } catch (error) {
                console.error(error);
            }
        },
        {
            timezone: "Asia/Singapore",
        }
    );
}

export default startCrons;
