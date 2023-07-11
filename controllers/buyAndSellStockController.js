import { Order } from "../models/Order.js";
import { fillOrder } from "../utils/queryDB.js";

const stockFunction = async (req, res) => {
    try {
        const {
            symbol,
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
        const { isFilled, status_object } = await fillOrder(newOrder);
        await newOrder.save();

        if (isFilled) {
            if (newOrder.orderType == "market") {
                res.status(200).json({
                    message: `Stock purchase was successful, your market order was filled at market price of ${newOrder.unitPrice}`,
                });
            } else {
                res.status(200).json({
                    message: `Stock purchase was successful. Your limit order has been filled at a better market price of ${newOrder.unitPrice}`,
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
                                current_price +
                                " was processed, however the market is currently closed. " +
                                status_object.notes,
                        });
                    } else {
                        res.status(200).json({
                            message:
                                "Your limit order at price " +
                                current_price +
                                " was processed, however, the market is currently closed and only opens from " +
                                status_object.local_open +
                                " to " +
                                status_object.local_close,
                        });
                    }
                }
            } else {
                if (status_object.notes) {
                    res.status(200).json({
                        message:
                            "Your market order at price " +
                            current_price +
                            " was processed, however the market is currently closed. " +
                            status_object.notes +
                            ".Your market order will be immediately filled when the market opens",
                    });
                } else {
                    res.status(200).json({
                        message:
                            "Your market order at price " +
                            current_price +
                            " was processed, however, the market is currently closed and only opens from " +
                            status_object.local_open +
                            " to " +
                            status_object.local_close +
                            ".Your market order will be immediately filled when the market opens",
                    });
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while trying to send an order.",
        });
    }
}

export { stockFunction };
