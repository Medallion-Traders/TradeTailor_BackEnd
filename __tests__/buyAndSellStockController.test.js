const { fillOrder } = require("../utils/queryDB.js");
const buyAndSellStockController = require("../controllers/buyAndSellStockController.js");
const convertUnixToLocaleString = require("../utils/timeConverter.js").default;
const { Order } = require("../models/Order.js");

jest.mock("../models/Order.js", () => {
    return {
        Order: jest.fn().mockImplementation(function(orderData) {
            return {
                ...orderData,
                save: jest.fn().mockResolvedValue(this),
            };
        }),
    };
});

jest.mock("../utils/queryDB.js");

const req = {
    user: { id: "testUserID" },
    body: {
        company: "Test Company",
        quantity: 100,
        orderType: "market",
        totalAmount: 5000,
        unitPrice: 50,
        transactionType: "buy",
    },
};
const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
};

jest.spyOn(buyAndSellStockController, "createOrder");
jest.spyOn(buyAndSellStockController, "processOrder");
jest.spyOn(buyAndSellStockController, "stockFunction");
jest.spyOn(buyAndSellStockController, "handleResponse");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Order Functions", () => {
    describe("buyAndSellStockController.createOrder", () => {
        it("creates a new order correctly", () => {
            const newOrder = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            expect(Order).toHaveBeenCalled();
            expect(newOrder.symbol).toBe("Test Company");
        });
    });

    describe("buyAndSellStockController.processOrder", () => {
        it("processes order correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            fillOrder.mockResolvedValue({
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
            });

            const result = await buyAndSellStockController.processOrder(order, "long");

            expect(result).toHaveProperty("isFilled");
            expect(result).toHaveProperty("status_object");
            expect(result).toHaveProperty("doesUserHaveEnoughBalance");
            expect(result).toHaveProperty("buy_or_sell_message");
        });

        it("handles buy direction correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            fillOrder.mockResolvedValue({
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
            });

            const result = await buyAndSellStockController.processOrder(order, "long");

            expect(result.buy_or_sell_message).toEqual("purchase");
        });

        it("handles sell direction correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            fillOrder.mockResolvedValue({
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
            });

            const result = await buyAndSellStockController.processOrder(order, "short");

            expect(result.buy_or_sell_message).toEqual("sale");
        });
    });

    describe("buyAndSellStockController.stockFunction", () => {
        it("handles buy transaction correctly", async () => {
            const mockReq = {
                ...req,
                body: { ...req.body, transactionType: "buy" },
            };
            const order = buyAndSellStockController.createOrder(mockReq.user, {
                symbol: mockReq.body.company,
                fixedQuantity: mockReq.body.quantity,
                orderType: mockReq.body.orderType,
                totalAmount: mockReq.body.totalAmount,
                unitPrice: mockReq.body.unitPrice,
            });

            fillOrder.mockResolvedValue({
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
            });

            await buyAndSellStockController.stockFunction(mockReq, res);

            expect(fillOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: "testUserID",
                    symbol: "Test Company",
                    fixedQuantity: 100,
                    orderType: "market",
                    totalAmount: 5000,
                    unitPrice: 50,
                    direction: "long",
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("handles sell transaction correctly", async () => {
            const mockReq = {
                ...req,
                body: { ...req.body, transactionType: "sell" },
            };
            const order = buyAndSellStockController.createOrder(mockReq.user, {
                symbol: mockReq.body.company,
                fixedQuantity: mockReq.body.quantity,
                orderType: mockReq.body.orderType,
                totalAmount: mockReq.body.totalAmount,
                unitPrice: mockReq.body.unitPrice,
            });

            fillOrder.mockResolvedValue({
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
            });

            await buyAndSellStockController.stockFunction(mockReq, res);

            expect(fillOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: "testUserID",
                    symbol: "Test Company",
                    fixedQuantity: 100,
                    orderType: "market",
                    totalAmount: 5000,
                    unitPrice: 50,
                    direction: "short",
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("handles exceptions correctly", async () => {
            const mockReq = {
                ...req,
                body: { ...req.body, transactionType: "buy" },
            };

            fillOrder.mockImplementation(() => {
                throw new Error("Test error");
            });

            await buyAndSellStockController.stockFunction(mockReq, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to buy/sell stock",
            });
        });
        it("create order fills with correct arguments when buy order is called", async () => {
            req.body.transactionType = "buy";
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const resolved = {
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            fillOrder.mockResolvedValue(resolved);

            const result = buyAndSellStockController.processOrder(order, "long");
            buyAndSellStockController.handleResponse(result, order, res);

            await buyAndSellStockController.stockFunction(req, res);

            expect(buyAndSellStockController.createOrder).toHaveBeenCalled();
            expect(buyAndSellStockController.processOrder).toHaveBeenCalled();
            expect(buyAndSellStockController.handleResponse).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });

        it("create order fills with correct arguments when sell order is called", async () => {
            req.body.transactionType = "sell";
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: req.body.orderType,
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const resolved = {
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            fillOrder.mockResolvedValue(resolved);

            const result = buyAndSellStockController.processOrder(order, "short");
            buyAndSellStockController.handleResponse(result, order, res);

            await buyAndSellStockController.stockFunction(req, res);

            expect(buyAndSellStockController.createOrder).toHaveBeenCalled();
            expect(buyAndSellStockController.processOrder).toHaveBeenCalled();
            expect(buyAndSellStockController.handleResponse).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe("buyAndSellStockController.handleResponse", () => {
        it("handles filled market order correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "market",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `Stock purchase was successful, your market order was filled at market price of ${order.unitPrice}`,
            });
        });

        it("handles filled limit order correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "limit",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `Stock purchase was successful. Your limit order has been filled at a better market price of ${order.unitPrice}`,
            });
        });

        it("handles unfilled limit order when market is open", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "limit",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: false,
                status_object: { current_status: "open" },
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `Limit order placed successfully, your limit order will be filled when the price hits ${order.unitPrice}`,
            });
        });

        it("handles unfilled limit order when market is closed without notes", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "limit",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: false,
                status_object: {
                    current_status: "closed",
                    local_open: 1625520000,
                    local_close: 1625550000,
                },
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `Your limit order at price ${
                    order.unitPrice
                } was processed, however, the market is currently closed and only opens from ${convertUnixToLocaleString(
                    result.status_object.local_open
                )} UTC to ${convertUnixToLocaleString(result.status_object.local_close)} UTC.`,
            });
        });

        it("handles unfilled market order when market is closed without notes", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "market",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: false,
                status_object: {
                    current_status: "closed",
                    local_open: 1625520000,
                    local_close: 1625550000,
                },
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `Your market order at price ${
                    order.unitPrice
                } was processed, however, the market is currently closed and only opens from ${convertUnixToLocaleString(
                    result.status_object.local_open
                )} UTC to ${convertUnixToLocaleString(
                    result.status_object.local_close
                )} UTC. Your market order will be immediately filled when the market opens`,
            });
        });

        it("handles insufficient balance correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "market",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: false,
                status_object: {},
                doesUserHaveEnoughBalance: false,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Your balance is insufficient to make this transaction, order rejected",
            });
        });

        it("handles exceptions correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "market",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                //isFilled: false, [missing field]
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            const originalConsoleError = console.error;
            console.error = jest.fn();

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "An error occurred while trying to send an order.",
            });

            console.error = originalConsoleError;
        });

        it("handles market order filled correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "market",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: true,
                status_object: {},
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });

        it("handles limit order not filled correctly", async () => {
            const order = buyAndSellStockController.createOrder(req.user, {
                symbol: req.body.company,
                fixedQuantity: req.body.quantity,
                orderType: "limit",
                totalAmount: req.body.totalAmount,
                unitPrice: req.body.unitPrice,
            });

            const result = {
                isFilled: false,
                status_object: { current_status: "open" },
                doesUserHaveEnoughBalance: true,
                buy_or_sell_message: "purchase",
            };

            await buyAndSellStockController.handleResponse(result, order, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });
    });
});
