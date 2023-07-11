import cron from "node-cron";
import UserModel from "../models/Users.js";
import PortfolioModel from "../models/Portfolio.js";
import PositionModel from "../models/Position.js";
import { Order } from "../models/Order.js";
import { getCurrentPrice, getCurrentMarketStatus } from "./queryWebSocket.js";

// Utility function for handling errors
function handleErrors(fn) {
    return function(...args) {
        return fn(...args).catch((err) => {
            console.error(`Function ${fn.name} broke and raised ${err}`);
        });
    };
}

// Utility function for fetching position
async function fetchPosition(positionId) {
    const position = await PositionModel.findById(positionId);
    if (!position) throw new Error("Position not found");
    return position;
}

// Utility function for calculating average price
function calculateAveragePrice(position, newOrder) {
    const totalQuantity = position.quantity + newOrder.fixedQuantity;
    // Prevent divison by zero
    if (totalQuantity === 0) {
        return 0;
    }
    const totalCost =
        position.averagePrice * position.quantity + newOrder.unitPrice * newOrder.fixedQuantity;
    return totalCost / totalQuantity;
}

// Utility function for closing orders
async function closeOrders(orders) {
    await Promise.all(
        orders.map(async (order) => {
            order.currentQuantity = 0;
            order.marketStatus = "closed";
            await order.save();
        })
    );
}

// Utility function for handling partial order closure
async function handlePartialClosure(orders, moving_quantity) {
    for (let order of orders) {
        if (moving_quantity >= order.currentQuantity) {
            moving_quantity -= order.currentQuantity;
            order.currentQuantity = 0;
            order.totalAmount = 0;
            order.marketStatus = "closed";
            await order.save();
        } else {
            order.currentQuantity -= moving_quantity;
            order.marketStatus = "open";
            order.totalAmount = order.currentQuantity * order.unitPrice;
            await order.save();
            break;
        }
    }
}

// Wrapped async functions
const createPortfolio = handleErrors(async function createPortfolio(newOrder, userId) {
    const newPosition = new PositionModel({
        symbol: newOrder.symbol,
        quantity: newOrder.fixedQuantity,
        averagePrice: newOrder.unitPrice,
        positionType: newOrder.direction,
        totalAmount: newOrder.fixedQuantity * newOrder.unitPrice,
        openingOrders: [newOrder._id],
        closingOrders: [],
        profit: 0,
    });

    await newPosition.save();

    const newPortfolio = new PortfolioModel({
        user: userId,
        positions: [newPosition._id],
    });

    await newPortfolio.save();

    //Reduce the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "decrease");
});

const addToLongPosition = handleErrors(async function addToLongPosition(positionId, newOrder) {
    const position = await fetchPosition(positionId);
    position.averagePrice = calculateAveragePrice(position, newOrder);

    // Update the position fields
    position.quantity = position.quantity + newOrder.fixedQuantity;

    //Update the total amount
    position.totalAmount = position.quantity * position.averagePrice;

    // Add the new order to the opening orders
    position.openingOrders.push(newOrder._id);

    // Save the updated position
    await position.save();

    //Reduce the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "decrease");
});

const closeShortPosition = handleErrors(async function closeShortPosition(positionId, newOrder) {
    const position = await fetchPosition(positionId);

    // Calculate the profit
    const profit = position.quantity * (position.averagePrice - newOrder.unitPrice);
    // Update the position fields
    position.quantity = 0;
    position.averagePrice = 0;
    position.totalAmount = 0;
    position.profit = profit;
    position.positionStatus = "closed";

    //Increase the cash balance by profit
    modifyCashBalance(newOrder, profit, "increase");

    // Set the marketStatus of the newOrder to be closed
    newOrder.marketStatus = "closed";
    await newOrder.save();

    // Add the new order to the closing orders
    await position.closingOrders.push(newOrder._id);

    // Close all openingOrders, both closed and open
    const populatedPosition = await position.populate("openingOrders");
    await closeOrders(populatedPosition.openingOrders);

    // Save the updated position
    await position.save();

    //Increase the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "increase");
});

const partialCloseShortPosition = handleErrors(async function partialCloseShortPosition(
    positionId,
    newOrder
) {
    const position = await fetchPosition(positionId);

    // Calculate the profit
    const profit = newOrder.fixedQuantity * (position.averagePrice - newOrder.unitPrice);

    // Update the position fields
    position.quantity -= newOrder.fixedQuantity;
    position.profit += profit;

    //Increase the cash balance by profit
    modifyCashBalance(newOrder, profit, "increase");

    //Set the marketStatus of the newOrder to be closed
    newOrder.marketStatus = "closed";
    await newOrder.save();

    // Add the new order to the closing orders
    position.closingOrders.push(newOrder._id);

    // Update the openingOrders field by finding the unclosed orders and closing them in a FIFO style by timestamp
    let orders = await position.populate("openingOrders").openingOrders;
    orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    //Calculate new Average price and new total amount
    let total_amount;
    orders.forEach((order) => {
        total_amount += order.currentQuantity * order.unitPrice;
    });

    position.totalAmount = total_amount;

    position.averagePrice = total_amount / position.quantity;

    // Save the updated position
    await position.save();

    //Increase the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "increase");
});

// Utility function for handling newly opened positions
const createNewPosition = handleErrors(async function createNewPosition(newOrder, userId) {
    const newPosition = new PositionModel({
        symbol: newOrder.symbol,
        quantity: newOrder.fixedQuantity,
        averagePrice: newOrder.unitPrice,
        positionType: newOrder.direction,
        totalAmount: newOrder.fixedQuantity * newOrder.unitPrice,
        openingOrders: [newOrder._id],
        closingOrders: [],
        profit: 0,
    });

    await newPosition.save();

    const portfolio = await PortfolioModel.findOne({ user: userId });
    if (!portfolio) throw new Error("Portfolio not found");
    portfolio.positions.push(newPosition._id);
    await portfolio.save();

    //Regardless of the direction of the trade, reduce the cash balance
    //For both longs and shorts, the cash balance is held hostage
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "decrease");
});

// Utility function for updating long position
const closeLongPosition = handleErrors(async function closeLongPosition(positionId, newOrder) {
    const position = await fetchPosition(positionId);
    // Calculate the profit
    const profit = position.quantity * (newOrder.unitPrice - position.averagePrice);
    // Update the position fields
    position.quantity = 0;
    position.averagePrice = 0;
    position.totalAmount = 0;
    position.profit = profit;
    position.positionStatus = "closed";

    //Increase the cash balance by profit
    modifyCashBalance(newOrder, profit, "increase");

    // Set the marketStatus of the newOrder to be closed
    newOrder.marketStatus = "closed";
    await newOrder.save();

    // Add the new order to the closing orders
    position.closingOrders.push(newOrder._id);

    // Close all openingOrders, both closed and open
    const populatedPosition = await position.populate("openingOrders");
    await closeOrders(populatedPosition.openingOrders);

    // Save the updated position
    await position.save();

    //Increase the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "increase");
});

// Utility function for handling partial long position closure
const partialCloseLongPosition = handleErrors(async function partialCloseLongPosition(
    positionId,
    newOrder
) {
    const position = await fetchPosition(positionId);

    // Calculate the profit
    const profit = newOrder.fixedQuantity * (newOrder.unitPrice - position.averagePrice);

    // Update the position fields
    position.quantity -= newOrder.fixedQuantity;
    position.profit += profit;

    //Increase the cash balance by profit
    modifyCashBalance(newOrder, profit, "increase");

    // Set the marketStatus of the newOrder to be closed
    newOrder.marketStatus = "closed";
    await newOrder.save();

    // Add the new order to the closing orders
    position.closingOrders.push(newOrder._id);

    // Update the openingOrders field by finding the unclosed orders and closing them in a FIFO style by timestamp
    let orders = await position.populate("openingOrders").openingOrders;
    orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    await handlePartialClosure(orders, newOrder.fixedQuantity);

    //Calculate new Average price and new total amount
    let total_amount;
    orders.forEach((order) => {
        total_amount += order.currentQuantity * order.unitPrice;
    });

    position.totalAmount = total_amount;

    position.averagePrice = total_amount / position.quantity;

    // Save the updated position
    await position.save();

    // Increase the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "increase");
});

// Utility function for adding to short position
const addToShortPosition = handleErrors(async function addToShortPosition(positionId, newOrder) {
    const position = await fetchPosition(positionId);
    position.averagePrice = calculateAveragePrice(position, newOrder);

    // Update the position fields
    position.quantity = position.quantity + newOrder.fixedQuantity;

    // Update the total amount
    position.totalAmount = position.quantity * position.averagePrice;

    // Add the new order to the opening orders
    position.openingOrders.push(newOrder._id);
    // Save the updated position
    await position.save();

    // Decrease the cash balance
    modifyCashBalance(newOrder, newOrder.fixedQuantity * newOrder.unitPrice, "decrease");
});

async function processLongPosition(newOrder, userId) {
    let portfolio = await PortfolioModel.findOne({ user: userId }).populate("positions");

    // If no portfolio, create new portfolio
    if (!portfolio) {
        createPortfolio(newOrder, userId);
        return;
    }

    // Find if a position for this symbol if it already exists in this portfolio and its status is "open". There should only be one open position per symbol at any time.
    const fetchPositions = await Promise.all(
        portfolio.positions.map((positionId) => fetchPosition(positionId))
    );

    const position = fetchPositions.find(
        (position) => position.symbol === newOrder.symbol && position.positionStatus === "open"
    );

    const positionId = position ? position._id : null;

    // If the position exists in the portfolio, find it
    if (positionId) {
        let position = await fetchPosition(positionId);
        console.log(position);

        // If the position is happens to be a long, add to the long position
        if (position.positionType === "long") {
            await addToLongPosition(position._id, newOrder);
        }
        // If the position is a short, the incoming long order is a closing order
        else {
            if (position.quantity > newOrder.fixedQuantity) {
                await partialCloseShortPosition(position._id, newOrder);
            } else if (position.quantity === newOrder.fixedQuantity) {
                await closeShortPosition(position._id, newOrder);
            } else {
                await closeShortPosition(position._id, newOrder);
                const remainderOrder = { ...newOrder };
                remainderOrder.fixedQuantity -= position.quantity;
                await createNewPosition(remainderOrder, userId);
            }
        }
    }
    // If the position does not exist, create a new one
    else {
        await createNewPosition(newOrder, userId);
    }
}

async function processShortPosition(newOrder, userId) {
    let portfolio = await PortfolioModel.findOne({ user: userId }).populate("positions");

    if (!portfolio) {
        createPortfolio(newOrder, userId);
        return;
    }

    // Find if a position for this symbol if it already exists in this portfolio and its status is "open". There should only be one open position per symbol at any time.
    const fetchPositions = await Promise.all(
        portfolio.positions.map((positionId) => fetchPosition(positionId))
    );

    const position = fetchPositions.find(
        (position) => position.symbol === newOrder.symbol && position.positionStatus === "open"
    );

    const positionId = position ? position._id : null;

    // If the position exists and it is a short position
    if (positionId) {
        let position = await fetchPosition(positionId);

        // If the position is happens to be a short, add to the short position
        if (position.positionType === "short") {
            await addToShortPosition(position._id, newOrder);
        }
        // If the position is a long, the incoming short order is a closing order
        else {
            if (position.quantity > newOrder.fixedQuantity) {
                await partialCloseLongPosition(position._id, newOrder);
            } else if (position.quantity === newOrder.fixedQuantity) {
                await closeLongPosition(position._id, newOrder);
            } else {
                await closeLongPosition(position._id, newOrder);
                const remainderOrder = { ...newOrder };
                remainderOrder.fixedQuantity -= position.quantity;
                await createNewPosition(remainderOrder, userId);
            }
        }
    }
    // If the position does not exist, create a new one
    else {
        await createNewPosition(newOrder, userId);
    }
}

async function modifyCashBalance(newOrder, amount, instruction) {
    let user = await UserModel.findById(newOrder.user);

    if (instruction === "increase") {
        user.balance += amount;
    } else {
        user.balance -= amount;
    }

    await user.save();
}

async function fillOrder(order) {
    const status_object = await getCurrentMarketStatus();

    if (status_object.current_status == "open") {
        if (order.orderType === "market") {
            const price = await getCurrentPrice(order.symbol);
            order.filledStatus = "filled";
            order.marketStatus = "open";
            order.unitPrice = price;
            order.totalAmount = order.fixedQuantity * order.unitPrice;
            await order.save();

            if (order.direction == "long") {
                processLongPosition(order, order.user);
            } else {
                processShortPosition(order, order.user);
            }
        } else if (order.orderType === "limit") {
            const price = await getCurrentPrice(order.symbol);
            if (price >= order.unitPrice) {
                order.filledStatus = "filled";
                order.marketStatus = "open";
                order.unitPrice = price;
                order.totalAmount = order.fixedQuantity * order.unitPrice;
                await order.save();

                if (order.direction == "long") {
                    processLongPosition(order, order.user);
                } else {
                    processShortPosition(order, order.user);
                }
            }
        }
        return { isFilled: true, status_object: status_object };
    } else {
        return { isFilled: false, status_object: status_object };
    }
}

cron.schedule("*/5 10-16 * * 1-5", async () => {
    const orders = await Order.find({ filledStatus: "pending" });

    // Create an array of promises
    const promises = orders.map(fillOrder);

    // Wait for all promises to resolve
    await Promise.all(promises);
});

// Exports
export { fillOrder };
