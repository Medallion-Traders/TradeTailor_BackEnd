const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const queryWebSocket = require("../utils/queryWebSocket.js");
const autoFillFunction = require("../controllers/autofillPriceController.js").default;

describe("autoFillFunction", () => {
    let req = {};
    let res = {};
    let axiosMock;

    beforeEach(() => {
        axiosMock = new MockAdapter(axios);

        req = {
            params: {
                symbol: "TSLA",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.resetAllMocks();
        axiosMock.restore();
    });

    it("should fetch current stock price", async () => {
        const expectedPrice = "500.00";
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(expectedPrice);
        axiosMock.onGet().reply(200, { "Global Quote": { "05. price": expectedPrice } });

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ price: expectedPrice });
    });

    it("should handle failure when unable to fetch stock price from Alphavantage axios call and getCurrentPrice is undefined", async () => {
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(undefined);
        axiosMock.onGet().reply(500);

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch stock price" });
    });

    it("should not make Alphavantage axios call if getCurrentPrice return non-undefined price or non-error", async () => {
        const expectedPrice = "500.00";
        const unexpectedPrice = "600.00";
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(expectedPrice);
        axiosMock.onGet().reply(200, { "Global Quote": { "05. price": unexpectedPrice } });

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ price: expectedPrice });
    });

    it("should make axios call and extract price correctly from AlphaVantage if getCurrentPrice is returns undefined price", async () => {
        const expectedPrice = 700.0;
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(undefined);
        axiosMock.onGet().reply(200, { "Global Quote": { "05. price": expectedPrice } });

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ price: expectedPrice });
    });

    it("should handle failure correctly when both getCurrentPrice and axios calls are rejected", async () => {
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockRejectedValue(
            new Error("Failed to fetch from websocket")
        );
        axiosMock.onGet().reply(500);

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch stock price" });
    });
});
