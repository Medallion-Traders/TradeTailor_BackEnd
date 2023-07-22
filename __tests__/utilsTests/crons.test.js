const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
    fetchMarketStatus,
    checkMarketStatusAndFillOrders,
    snapshotProfits,
} = require("../../utils/crons.js");
const queryWebSocket = require("../../utils/queryWebSocket.js");
const queryDB = require("../../utils/queryDB.js");
const { Order } = require("../../models/Order.js");
const PositionModel = require("../../models/Position.js").default;
const UserModel = require("../../models/Users.js").default;
const AlertModel = require("../../models/Alert.js").default;
const PortfolioModel = require("../../models/Portfolio.js").default;
const DailyProfitModel = require("../../models/Profit.js").default;

const usMarketStatusMock = {
    market_type: "stock",
    primary_exchanges: ["NYSE", "NASDAQ"],
    local_open: 1640000000, // Arbitrary UNIX time
    local_close: 1640003600, // Arbitrary UNIX time
    current_status: "closed",
    notes: "US market is closed",
};

queryWebSocket.getCurrentMarketStatus = jest.fn();
queryDB.fillOrder = jest.fn();
queryDB.updateMarketStatus = jest.fn();

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(() => {
    jest.clearAllMocks();
});

test("fetchMarketStatus calls getCurrentMarketStatus", async () => {
    await fetchMarketStatus();
    expect(queryWebSocket.getCurrentMarketStatus).toHaveBeenCalled();
});

test("checkMarketStatusAndFillOrders fills pending orders", async () => {
    // Simulate current time to be within of market hours
    const currentTime = usMarketStatusMock.local_close - 1;
    const mockUserData = {
        email: "testuser3@gmail.com",
        password: "testuser123456",
        role: "normal_user",
        isVerified: true,
        emailToken: "testtoken",
        username: "testuser3",
        about: "Hello, i am test user 3, this is my about me",
    };
    const user = await UserModel.create(mockUserData);
    const mockOrder = {
        user: user._id,
        symbol: "AAPL",
        fixedQuantity: 10,
        currentQuantity: 10,
        orderType: "buy",
        totalAmount: 1500,
        unitPrice: 150,
        filledStatus: "pending",
        marketStatus: "open",
        direction: "long",
    };
    await Order.create(mockOrder);
    queryDB.fillOrder.mockReturnValue(
        Promise.resolve({
            isFilled: true,
            doesUserHaveEnoughBalance: true,
            status_object: usMarketStatusMock,
        })
    );
    await checkMarketStatusAndFillOrders(currentTime, (currentTime) => true);
    const alert = await AlertModel.findOne({
        user: user._id,
    });
    expect(alert).not.toBeNull();
});

test("snapshotProfits creates a dailyProfit document for each user", async () => {
    const mockUser = {
        email: "testuser@gmail.com",
        password: "testuser123456",
        role: "normal_user",
        isVerified: true,
        emailToken: "testtoken",
        username: "testuser",
        about: "Hello, i am test user, this is my about me",
    };
    const createdUser = await UserModel.create(mockUser);
    const orderA = await Order.create({
        user: createdUser._id,
        symbol: "testuser",
        fixedQuantity: 10,
        currentQuantity: 10,
        orderType: "buy",
        totalAmount: 1500,
        unitPrice: 150,
        filledStatus: "filled",
        marketStatus: "open",
        direction: "long",
    });
    const positionA = await PositionModel.create({
        symbol: "testuser",
        quantity: 10,
        averagePrice: 100,
        positionType: "long",
        totalAmount: 1000,
        openingOrders: [orderA._id],
        closingOrders: [],
        profit: 300,
        positionStatus: "open",
    });
    const mockPortfolio = {
        user: createdUser._id,
        positions: [positionA._id],
    };

    await PortfolioModel.create(mockPortfolio);
    await snapshotProfits();
    const profit = await DailyProfitModel.findOne({ user: createdUser._id });
    expect(profit).not.toBeNull();
    expect(profit.profit).toBe(300);
});

test("checkMarketStatusAndFillOrders does not fill orders when market is closed", async () => {
    // Simulate current time to be outside of market hours
    const currentTime = usMarketStatusMock.local_close + 1;
    const func = (currentTime) => false;
    await checkMarketStatusAndFillOrders(currentTime, func);
    expect(queryDB.fillOrder).not.toHaveBeenCalled();
});

test("snapshotProfits does create a dailyProfit document when there are profits", async () => {
    const mockUser = {
        email: "testuser2@gmail.com",
        password: "testuser123456",
        role: "normal_user",
        isVerified: true,
        emailToken: "testtoken",
        username: "testuser2",
        about: "Hello, i am test user, this is my about me",
    };
    const createdUser = await UserModel.create(mockUser);
    const mockPortfolio = {
        user: createdUser._id,
        positions: [],
    };
    await PortfolioModel.create(mockPortfolio);
    await snapshotProfits();
    const profit = await DailyProfitModel.findOne({ user: createdUser._id });
    expect(profit).not.toBeNull();
    expect(profit.profit).toBe(0);
});

test("fetchMarketStatus updates the market status", async () => {
    queryWebSocket.getCurrentMarketStatus.mockReturnValue(usMarketStatusMock);
    await fetchMarketStatus();
    expect(queryDB.updateMarketStatus).toHaveBeenCalledWith(usMarketStatusMock);
});
