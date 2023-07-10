import axios from "axios";
import dotenv from "dotenv";
import { LimitOrderModel, MarketOrderModel } from "../models/Order.js";

dotenv.config();

// Companies data
const companies = [
    { id: "1", name: "Apple", symbol: "AAPL" },
    { id: "2", name: "Google", symbol: "GOOGL" },
    { id: "3", name: "Microsoft", symbol: "MSFT" },
    { id: "4", name: "Amazon", symbol: "AMZN" },
    { id: "5", name: "Meta Platforms Inc", symbol: "META" },
    { id: "6", name: "Tesla", symbol: "TSLA" },
    { id: "7", name: "Netflix", symbol: "NFLX" },
    { id: "8", name: "IBM", symbol: "IBM" },
    { id: "9", name: "Intel", symbol: "INTC" },
    { id: "10", name: "Adobe", symbol: "ADBE" },
    // Add more companies as needed
];

const buyStockFunction = async (req, res) => {
    try {
        const { company, quantity, orderType, totalAmount, unitPrice } = req.body;
        // Validate the data
        if (!company || !quantity || !orderType || !totalAmount || !unitPrice) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }
        if (quantity < 1) {
            return res
                .status(400)
                .json({ message: `Please enter a valid quantity, quantity cannot be ${quantity}` });
        }

        if (orderType == "market") {
            try {
                const newMarketOrder = new MarketOrderModel({
                    user: req.user.id,
                    company,
                    quantity,
                    orderType,
                    totalAmount,
                    unitPrice,
                    status: "open",
                    profit: 0,
                });

                await newMarketOrder.save();
                return res.status(200).json({ message: "Market order successfully placed." });
            } catch (error) {
                return res.status(500).json({
                    message: "An error occurred while trying to send a market order.",
                });
            }
        } else if (orderType === "limit") {
            try {
                const response = await axios.get(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${company}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
                );

                const current_price = response.data["Global Quote"]["05. price"];

                if (current_price <= unitPrice) {
                    const newMarketOrder = new MarketOrderModel({
                        user: req.user.id,
                        company,
                        quantity,
                        orderType,
                        totalAmount,
                        current_price,
                        status: "open",
                        profit: 0,
                    });
                    await newMarketOrder.save();
                    return res.status(200).json({
                        message:
                            "Stock purchase was successful, your limit order was converted to market order and filled at market price" +
                            current_price,
                    });
                } else {
                    const newLimitOrder = new LimitOrderModel({
                        user: req.user.id,
                        company,
                        quantity,
                        orderType,
                        totalAmount,
                        unitPrice,
                        status: "open",
                        profit: 0,
                    });
                    await newLimitOrder.save();
                    return res.json({ message: "Limit order was successfully placed!" });
                }
            } catch (error) {
                return res.status(500).json({
                    message: "An error occurred while trying to send a limit order.",
                });
            }
        } else {
            return res.status(400).json({ message: "Please enter a valid order type" });
        }
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while trying to buy stock.",
        });
    }
};

export default buyStockFunction;
