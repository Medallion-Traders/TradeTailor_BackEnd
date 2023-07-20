import { Order } from "../models/Order.js";
import { fillOrder } from "../utils/queryDB.js";
import convertUnixToUtc from "../utils/timeConverter.js";

const stockFunction = async (req, res) => {
    try {
        const {
            company: symbol,
            quantity: fixedQuantity,
            orderType,
            totalAmount,
            unitPrice,
            transactionType,
        } = req.body;

        // Create a generic order without direction
        const newOrder = new Order({
            user: req.user.id,
            symbol,
            fixedQuantity,
            currentQuantity: fixedQuantity,
            orderType,
            totalAmount,
            unitPrice,
            filledStatus: "pending",
            marketStatus: "undefined",
        });

        if (transactionType === "buy") {
            await processOrder(newOrder, "long", res);
        } else {
            await processOrder(newOrder, "short", res);
        }
    } catch (error) {
        console.error("Error buying/selling stock:", error);
        return res.status(500).json({ error: "Failed to buy/sell stock" });
    }
};

async function processOrder(newOrder, direction, res) {
    try {
        newOrder.direction = direction;
        const { isFilled, status_object, doesUserHaveEnoughBalance } = await fillOrder(newOrder);
        const buy_or_sell_message = direction == "long" ? "purchase" : "sale";
        await newOrder.save();

        if (doesUserHaveEnoughBalance) {
            if (isFilled) {
                if (newOrder.orderType == "market") {
                    res.status(200).json({
                        message: `Stock ${buy_or_sell_message} was successful, your market order was filled at market price of ${newOrder.unitPrice}`,
                    });
                } else {
                    res.status(200).json({
                        message: `Stock ${buy_or_sell_message} was successful. Your limit order has been filled at a better market price of ${newOrder.unitPrice}`,
                    });
                }
            } else {
                if (newOrder.orderType == "limit") {
                    if (status_object.current_status == "open") {
                        res.status(200).json({
                            message: `Limit order placed successfully, your limit order will be filled when the price hits ${newOrder.unitPrice}`,
                        });
                    } else {
                        if (status_object.notes) {
                            res.status(200).json({
                                message:
                                    "Your limit order at price " +
                                    newOrder.unitPrice +
                                    " was processed, however the market is currently closed. " +
                                    status_object.notes,
                            });
                        } else {
                            res.status(200).json({
                                message:
                                    "Your limit order at price " +
                                    newOrder.unitPrice +
                                    " was processed, however, the market is currently closed and only opens from " +
                                    convertUnixToUtc(status_object.local_open) +
                                    " UTC to " +
                                    convertUnixToUtc(status_object.local_close) +
                                    " UTC.",
                            });
                        }
                    }
                } else {
                    if (status_object.notes) {
                        res.status(200).json({
                            message:
                                "Your market order at price " +
                                newOrder.unitPrice +
                                " was processed, however the market is currently closed. " +
                                status_object.notes +
                                ".Your market order will be immediately filled when the market opens",
                        });
                    } else {
                        res.status(200).json({
                            message:
                                "Your market order at price " +
                                newOrder.unitPrice +
                                " was processed, however, the market is currently closed and only opens from " +
                                convertUnixToUtc(status_object.local_open) +
                                " UTC to " +
                                convertUnixToUtc(status_object.local_close) +
                                " UTC. Your market order will be immediately filled when the market opens",
                        });
                    }
                }
            }
        } else {
            res.status(200).json({
                message: "Your balance is insufficient to make this transaction",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while trying to send an order.",
        });
    }
}

export { stockFunction };
