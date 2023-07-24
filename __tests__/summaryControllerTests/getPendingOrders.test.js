const { getPendingOrders } = require("../../controllers/summaryController.js");
const { Order } = require("../../models/Order.js");
const httpMocks = require("node-mocks-http");

jest.mock("../../models/Order.js");

let req, res, next;

describe("getPendingOrders", () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it("returns a 200 status and correct orders when function works as expected", async () => {
        req.user = { id: "userId" }; // mock user id
        const ordersMock = [
            {
                userId: "userId",
                symbol: "AAPL",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 100,
                unitPrice: 1,
                filledStatus: "pending",
                marketStatus: "open",
                direction: "long",
            },
            {
                userId: "userId",
                symbol: "AMD",
                fixedQuantity: 100,
                currentQuantity: 100,
                orderType: "market",
                totalAmount: 100,
                unitPrice: 1,
                filledStatus: "pending",
                marketStatus: "open",
                direction: "long",
            },
        ];
        Order.find.mockResolvedValueOnce(ordersMock);

        await getPendingOrders(req, res, next);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(ordersMock);
    });

    it("handles error when Order.find throws an error", async () => {
        req.user = { id: "userId" }; // mock user id
        const errorMessage = "Error finding orders";
        Order.find.mockRejectedValueOnce(new Error(errorMessage));

        await getPendingOrders(req, res, next);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData())).toEqual({ error: "Error: " + errorMessage });
    });

    it("returns a 200 status and an empty array when there are no orders", async () => {
        req.user = { id: "userId" }; // mock user id
        const ordersMock = [];
        Order.find.mockResolvedValueOnce(ordersMock);

        await getPendingOrders(req, res, next);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(ordersMock);
    });
});
