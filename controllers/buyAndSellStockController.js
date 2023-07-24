import { Order } from "../models/Order.js";
import { fillOrder } from "../utils/queryDB.js";
import convertUnixToUtc from "../utils/timeConverter.js";

const createOrder = (userData, orderData) => {
    return new Order({
        user: userData.id,
        symbol: orderData.symbol,
        fixedQuantity: orderData.fixedQuantity,
        currentQuantity: orderData.fixedQuantity,
        orderType: orderData.orderType,
        totalAmount: orderData.totalAmount,
        unitPrice: orderData.unitPrice,
        filledStatus: "pending",
        marketStatus: "undefined",
    });
};

const processOrder = async (order, direction) => {
    order.direction = direction;
    const { isFilled, status_object, doesUserHaveEnoughBalance } = await fillOrder(order);
    const buy_or_sell_message = direction == "long" ? "purchase" : "sale";

    if (doesUserHaveEnoughBalance) {
        await order.save();
    }

    return { isFilled, status_object, doesUserHaveEnoughBalance, buy_or_sell_message };
};

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

        const newOrder = createOrder(req.user, {
            symbol,
            fixedQuantity,
            orderType,
            totalAmount,
            unitPrice,
        });

        if (transactionType === "buy") {
            const result = await processOrder(newOrder, "long");
            handleResponse(result, newOrder, res);
        } else {
            const result = await processOrder(newOrder, "short");
            handleResponse(result, newOrder, res);
        }
    } catch (error) {
        console.error("Error buying/selling stock:", error);
        return res.status(500).json({ error: "Failed to buy/sell stock" });
    }
};

async function handleResponse(result, newOrder, res) {
    try {
        const { isFilled, status_object, doesUserHaveEnoughBalance, buy_or_sell_message } = result;

        if (
            isFilled == undefined ||
            status_object == undefined ||
            doesUserHaveEnoughBalance == undefined ||
            buy_or_sell_message == undefined
        ) {
            throw new Error("Missing parameters in result object");
        }

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
                message: "Your balance is insufficient to make this transaction, order rejected",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred while trying to send an order.",
        });
    }
}

export { createOrder, processOrder, stockFunction, handleResponse };
