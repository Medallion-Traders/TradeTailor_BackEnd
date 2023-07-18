const { getOpenPositions } = require("../../controllers/summaryController.js");
const PortfolioModel = require("../../models/Portfolio.js").default;
const httpMocks = require("node-mocks-http");

jest.mock("../../models/Portfolio.js");

let req, res, next;

describe("getOpenPositions", () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it("returns a 200 status and correct positions when function works as expected", async () => {
        req.user = { id: "userId" }; // mock user id
        const positionsMock = [
            {
                symbol: "AAPL",
                quantity: 100,
                averagePrice: 1,
                positionType: "long",
                totalAmount: 50,
                openingOrders: [
                    {
                        user: "userId",
                        symbol: "AAPL",
                        fixedQuantity: 100,
                        currentQuantity: 50,
                        orderType: "market",
                        totalAmount: 50,
                        unitPrice: 1,
                        filledStatus: "filled",
                        marketStatus: "open",
                        direction: "long",
                    },
                ],
                closingOrders: [
                    {
                        user: "userId",
                        symbol: "AAPL",
                        fixedQuantity: 50,
                        currentQuantity: 50,
                        orderType: "market",
                        totalAmount: 50,
                        unitPrice: 1,
                        filledStatus: "filled",
                        marketStatus: "open",
                        direction: "short",
                    },
                ],
                profit: 0,
                positionStatus: "open",
            },
        ];

        PortfolioModel.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue(
                Promise.resolve({
                    positions: positionsMock,
                })
            ),
        });

        await getOpenPositions(req, res, next);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(positionsMock);
        expect(PortfolioModel.findOne).toHaveBeenCalled();
        expect(PortfolioModel.findOne).toHaveBeenCalledWith({ user: "userId" });
        expect(PortfolioModel.findOne().populate).toHaveBeenCalledWith({
            path: "positions",
            match: { positionStatus: "open" },
            populate: [{ path: "openingOrders" }, { path: "closingOrders" }],
        });
    });

    it("handles error when PortfolioModel.findOne throws an error", async () => {
        req.user = { id: "userId" }; // mock user id
        const errorMessage = "Error finding portfolio";
        PortfolioModel.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue(Promise.reject(new Error(errorMessage))),
        });

        await getOpenPositions(req, res, next);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData())).toEqual({ error: "Error: " + errorMessage });
    });

    it("returns a 200 status and an empty array when there is no portfolio for user", async () => {
        req.user = { id: "userId" }; // mock user id
        PortfolioModel.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue(Promise.resolve(null)),
        });

        await getOpenPositions(req, res, next);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual([]);
    });

    it("returns a 200 status and positions when there are only open positions", async () => {
        req.user = { id: "userId" }; // mock user id
        const positionsMock = [
            {
                symbol: "AAPL",
                quantity: 100,
                averagePrice: 1,
                positionType: "long",
                totalAmount: 100,
                openingOrders: [
                    {
                        user: "userId",
                        symbol: "AAPL",
                        fixedQuantity: 100,
                        currentQuantity: 100,
                        orderType: "market",
                        totalAmount: 100,
                        unitPrice: 1,
                        filledStatus: "filled",
                        marketStatus: "open",
                        direction: "long",
                    },
                ],
                closingOrders: [],
                profit: 0,
                positionStatus: "open",
            },
        ];

        PortfolioModel.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue(
                Promise.resolve({
                    positions: positionsMock,
                })
            ),
        });

        await getOpenPositions(req, res, next);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(positionsMock);
    });
});
