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

    it("should handle failure when unable to fetch stock price", async () => {
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(null);
        axiosMock.onGet().reply(500);

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch stock price" });
    });

    it("should not make axios call if getCurrentPrice resolves successfully", async () => {
        const expectedPrice = "500.00";
        const unexpectedPrice = "600.00";
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockResolvedValue(expectedPrice);
        axiosMock.onGet().reply(200, { "Global Quote": { "05. price": unexpectedPrice } });

        await autoFillFunction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ price: expectedPrice });
    });

    it("should make axios call and extract price correctly if getCurrentPrice is rejected", async () => {
        const expectedPrice = "700.00";
        jest.spyOn(queryWebSocket, "getCurrentPrice").mockRejectedValue(
            new Error("Failed to fetch from websocket")
        );
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
