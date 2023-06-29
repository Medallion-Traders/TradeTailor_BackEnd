import axios from "axios";
import dotenv from "dotenv";
import { LimitOrderModel, MarketOrderModel } from "../models/Order.js";

dotenv.config();

const buyStockFunction = async (req, res) => {
    try {
        const { company, quantity, orderType, totalAmount, unitPrice } = req.body;

        //Validate the data
        if (!company || !quantity || !orderType || !totalAmount || !unitPrice) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }
        if (quantity < 1) {
            return res
                .status(400)
                .json({ message: `Please enter a valid quantity, quantity cannot be ${quantity}` });
        }

        //The token sent from the auth middleware is used in the user id field below
        //Market orders are automatically filled and their status is set to "open"

        if (orderType === "market") {
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
            } catch (error) {
                res.status(500).json({
                    message: "An error occurred while trying to send a market order.",
                });
            }
        } else if (orderType === "limit") {
            try {
                //Query AlphaVantage to see if the order can be filled immediately
                const response = await axios.get(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${company}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
                );

                // Extract the stock price from the Alpha Vantage API response
                const current_price = response.data["Global Quote"]["05. price"];

                if (current_price <= unitPrice) {
                    //If the price is lesser than or equal to the limit price, fill the order, and rename it as market order price
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
                    res.status(200).json({
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
                    res.json({ message: "Limit order was successfully placed!" });
                }
            } catch (error) {
                res.status(500).json({
                    message: "An error occurred while trying to send a limit order.",
                });
            }
        } else {
            //Likely frontend response setting error
            return res.status(400).json({ message: "Please enter a valid order type" });
        }
    } catch (error) {
        res.status(500).json({
            message: "An error occurred while trying to buy stock.",
        });
    }
};

export default buyStockFunction;
