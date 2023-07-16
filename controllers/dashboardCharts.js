import PortfolioModel from "../models/Portfolio.js";
import DailyProfitModel from "../models/Profit.js";
import moment from "moment";

async function getStockPercentages(req, res) {
    try {
        const user_id = req.user.id;

        //Find all their open positions
        const positions = await PortfolioModel.find({
            user: user_id,
        }).populate("positions");

        const open_positions = positions.filter((position) => position.positionStatus === "open");

        //Treatment is the same for long and short positions as their cash balance is locked
        const total_invested_amount = open_positions.reduce(
            (acc, position) => acc + position.totalAmount,
            0
        );

        let result = [];
        open_positions.forEach((position) => {
            const percentage = (position.totalAmount / total_invested_amount) * 100;
            const roundedPercentage = Math.round(percentage * 100) / 100; // Round to 2 decimal points
            result.push({
                stock: position.symbol,
                percentage: roundedPercentage,
            });
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getProfitLoss(req, res) {
    try {
        const userId = req.user.id;

        // Subtract 30 days from the current date to get the start date for our query
        const startDate = moment()
            .subtract(30, "days")
            .toDate()
            .toISOString()
            .split("T")[0];

        // Query the database for all profit records for the user in the last 30 days, sorted by date
        const profits = await DailyProfitModel.find({
            user: userId,
            date: { $gte: startDate },
        }).sort("date");

        // Initialize an empty array to hold our profit/loss data
        const profitLossData = [];

        // Iterate through each profit record
        for (let i = 0; i < profits.length - 1; i++) {
            // Calculate the difference in profit between the current day and the previous day
            const profitDiff = profits[i + 1].profit - profits[i].profit;

            // Add the profit difference and the date to our profit/loss data array
            profitLossData.push({
                x: profits[i + 1].date.toISOString().split("T")[0],
                y: profitDiff,
            });
        }

        // Return the profit/loss data
        return res.status(200).json(profitLossData);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export { getStockPercentages, getProfitLoss };
