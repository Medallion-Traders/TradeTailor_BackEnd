import { Order } from "../models/Order.js";
import { processLongPosition, processShortPosition } from "../utils/queryDB.js";
import getCurrentPrice from "../utils/queryWebSocket.js";

const buyStockFunction = async (req, res) => {
    try {
        const { ticker, quantity: fixedQuantity, orderType, totalAmount, unitPrice } = req.body;

        const current_price = await getCurrentPrice(ticker);

        if (orderType === "market") {
            try {
                const newOrder = new Order({
                    user: req.user.id,
                    ticker,
                    fixedQuantity,
                    currentQuantity: fixedQuantity,
                    orderType,
                    totalAmount,
                    unitPrice: current_price,
                    filledStatus: "filled",
                    marketStatus: "open",
                    direction: "long",
                });

                processLongPosition(newOrder, req.user.id);

                await newOrder.save();

                res.status(200).json({
                    message:
                        "Stock purchase was successful, your market order was filled at market price " +
                        current_price,
                });
            } catch (error) {
                res.status(500).json({
                    message: "An error occurred while trying to send a market order.",
                });
            }
        } else if (orderType === "limit") {
            try {
                if (current_price <= unitPrice) {
                    const newOrder = new Order({
                        user: req.user.id,
                        ticker,
                        fixedQuantity,
                        currentQuantity: fixedQuantity,
                        orderType,
                        totalAmount,
                        unitPrice: current_price,
                        filledStatus: "filled",
                        marketStatus: "open",
                        direction: "long",
                    });

                    processLongPosition(newOrder, req.user.id);

                    await newOrder.save();
                    res.status(200).json({
                        message:
                            "Stock purchase was successful, your limit order was converted to market order and filled at market price " +
                            current_price,
                    });
                } else {
                    const newOrder = new Order({
                        user: req.user.id,
                        ticker,
                        fixedQuantity,
                        currentQuantity: fixedQuantity,
                        orderType,
                        totalAmount,
                        unitPrice,
                        filledStatus: "pending",
                        marketStatus: "undefined",
                        direction: "long",
                    });

                    processLongPosition(newOrder, req.user.id);

                    await newOrder.save();
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

const sellStockFunction = async (req, res) => {
    try {
        const { ticker, quantity: fixedQuantity, orderType, totalAmount, unitPrice } = req.body;

        const current_price = await getCurrentPrice(ticker);

        if (orderType === "market") {
            try {
                const newOrder = new Order({
                    user: req.user.id,
                    ticker,
                    fixedQuantity,
                    currentQuantity: fixedQuantity,
                    orderType,
                    totalAmount,
                    unitPrice: current_price,
                    filledStatus: "filled",
                    marketStatus: "open",
                    direction: "short",
                });

                processShortPosition(newOrder, req.user.id);

                await newOrder.save();

                res.status(200).json({
                    message:
                        "Stock sale was successful, your market order was filled at market price " +
                        current_price,
                });
            } catch (error) {
                res.status(500).json({
                    message: "An error occurred while trying to send a market order.",
                });
            }
        } else if (orderType === "limit") {
            try {
                if (current_price >= unitPrice) {
                    const newOrder = new Order({
                        user: req.user.id,
                        ticker,
                        fixedQuantity,
                        currentQuantity: fixedQuantity,
                        orderType,
                        totalAmount,
                        unitPrice: current_price,
                        filledStatus: "filled",
                        marketStatus: "open",
                        direction: "short",
                    });

                    await processShortPosition(newOrder, req.user.id);

                    await newOrder.save();
                    res.status(200).json({
                        message:
                            "Stock sale was successful, your limit order was converted to market order and filled at market price " +
                            current_price,
                    });
                } else {
                    const newOrder = new Order({
                        user: req.user.id,
                        ticker,
                        fixedQuantity,
                        currentQuantity: fixedQuantity,
                        orderType,
                        totalAmount,
                        unitPrice,
                        filledStatus: "pending",
                        marketStatus: "undefined",
                        direction: "short",
                    });

                    await processShortPosition(newOrder, req.user.id);

                    await newOrder.save();
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
            message: "An error occurred while trying to sell stock.",
        });
    }
};

export { buyStockFunction, sellStockFunction };
