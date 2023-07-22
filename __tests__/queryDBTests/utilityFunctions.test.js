const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const PositionModel = require("../../models/Position.js").default;
const { Order } = require("../../models/Order.js");
const UserModel = require("../../models/Users.js").default;
const {
    fetchPosition,
    calculateAveragePrice,
    closeOrders,
    handlePartialClosure,
} = require("../../utils/queryDB.js");

let mongoServer;

beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
    jest.clearAllMocks();
});

describe("Utility Functions", () => {
    describe("fetchPosition", () => {
        it("should fetch a position by id", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder = new Order({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder.save();
            const mockOrder2 = new Order({
                user: newUser._id,
                symbol: "AMD",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder2.save();
            const mockPosition = new PositionModel({
                symbol: "AAPL",
                quantity: 100,
                averagePrice: 100,
                positionType: "long",
                totalAmount: 10000,
                openingOrders: [mockOrder._id],
                closingOrders: [],
                profit: 0,
                positionStatus: "open",
            });
            await mockPosition.save();
            const fetchedPosition = await fetchPosition(mockPosition._id);

            expect(fetchedPosition).toHaveProperty("_id");
            expect(fetchedPosition._id.toString()).toBe(mockPosition._id.toString());
            expect(fetchedPosition.averagePrice).toBe(mockPosition.averagePrice);
            expect(fetchedPosition.quantity).toBe(mockPosition.quantity);
        });

        it("should throw an error if position is not found", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            await expect(fetchPosition(newUser._id)).rejects.toThrow("Position not found");
        });
    });

    describe("calculateAveragePrice", () => {
        it("should correctly calculate average price", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder = new Order({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder.save();
            const mockPosition = new PositionModel({
                symbol: "AAPL",
                quantity: 100,
                averagePrice: 100,
                positionType: "long",
                totalAmount: 10000,
                openingOrders: [mockOrder._id],
                closingOrders: [],
                profit: 0,
                positionStatus: "open",
            });
            await mockPosition.save();
            const newmockOrder = await Order.create({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 20,
                currentQuantity: 20,
                orderType: "market",
                totalAmount: 2300,
                unitPrice: 115,
                filledStatus: "filled",
                marketStatus: "closed",
                direction: "long",
            });
            const averagePrice = calculateAveragePrice(mockPosition, newmockOrder);

            expect(averagePrice).toBe(102.5); // 11000 / 110 = 102.5
        });

        it("should return 0 if total quantity is 0", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder = new Order({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 0,
                currentQuantity: 0,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder.save();
            const mockPosition = new PositionModel({
                symbol: "AAPL",
                quantity: 0,
                averagePrice: 100,
                positionType: "long",
                totalAmount: 10000,
                openingOrders: [mockOrder._id],
                closingOrders: [],
                profit: 0,
                positionStatus: "open",
            });

            const averagePrice = calculateAveragePrice(mockPosition, mockOrder);

            expect(averagePrice).toBe(0);
        });
    });

    describe("closeOrders", () => {
        it("should close all provided orders", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder = new Order({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 0,
                currentQuantity: 0,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder.save();
            const mockOrder2 = new Order({
                user: newUser._id,
                symbol: "AMD",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 10000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            await mockOrder2.save();
            const mockOrders = [mockOrder, mockOrder2];

            await closeOrders(mockOrders);

            const updatedOrders = await Order.find({});

            updatedOrders.forEach((order) => {
                expect(order.currentQuantity).toBe(0);
                expect(order.marketStatus).toBe("closed");
            });
        });
    });
    describe("handlePartialClosure", () => {
        it("should correctly handle partial order closure [2 Orders, first closed fully]", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder1 = await Order.create({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 100,
                currentQuantity: 80,
                orderType: "market",
                totalAmount: 8000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            const mockOrder2 = await Order.create({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 50,
                currentQuantity: 50,
                orderType: "market",
                totalAmount: 5000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });

            await handlePartialClosure([mockOrder1, mockOrder2], 120);

            const updatedOrder1 = await Order.findById(mockOrder1._id);
            const updatedOrder2 = await Order.findById(mockOrder2._id);

            expect(updatedOrder1.currentQuantity).toBe(0);
            expect(updatedOrder1.totalAmount).toBe(0);
            expect(updatedOrder1.marketStatus).toBe("closed");

            expect(updatedOrder2.currentQuantity).toBe(10);
            expect(updatedOrder2.totalAmount).toBe(1000);
            expect(updatedOrder2.marketStatus).toBe("open");
        });
        it("should correctly handle partial order closure [No closure]", async () => {
            const newUser = new UserModel({
                email: "user@example.com",
                password: "password123",
                username: "user123",
            });
            await newUser.save();
            const mockOrder1 = await Order.create({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 100,
                currentQuantity: 80,
                orderType: "market",
                totalAmount: 8000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });
            const mockOrder2 = await Order.create({
                user: newUser._id,
                symbol: "AAPL",
                fixedQuantity: 50,
                currentQuantity: 50,
                orderType: "market",
                totalAmount: 5000,
                unitPrice: 100,
                filledStatus: "filled",
                marketStatus: "open",
                direction: "long",
            });

            await handlePartialClosure([mockOrder1, mockOrder2], 10);

            const updatedOrder1 = await Order.findById(mockOrder1._id);
            const updatedOrder2 = await Order.findById(mockOrder2._id);

            expect(updatedOrder1.currentQuantity).toBe(70);
            expect(updatedOrder1.totalAmount).toBe(7000);
            expect(updatedOrder1.marketStatus).toBe("open");

            expect(updatedOrder2.currentQuantity).toBe(50);
            expect(updatedOrder2.totalAmount).toBe(5000);
            expect(updatedOrder2.marketStatus).toBe("open");
        });
    });
});
