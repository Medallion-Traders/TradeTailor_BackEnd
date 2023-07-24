const { getCurrentPrice, getCurrentMarketStatus } = require("../../utils/queryWebSocket.js");
import axios from "axios";

jest.mock("axios");

describe("getCurrentPrice", () => {
    it("fetches the current price of a stock symbol", async () => {
        const data = { price: 123.45 };
        axios.get.mockResolvedValue({ data });

        const result = await getCurrentPrice("AAPL");
        expect(result).toBe(data.price);
        expect(axios.get).toHaveBeenCalledWith(
            `${process.env.REACT_APP_WEBSOCKET_URL}/webSocket/price/AAPL`
        );
    });

    it("handles errors correctly", async () => {
        const error = new Error("Test error");
        axios.get.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, "log");
        consoleSpy.mockImplementation(() => {});

        await getCurrentPrice("AAPL");
        expect(console.log).toHaveBeenCalledWith(error);

        consoleSpy.mockRestore();
    });
});

describe("getCurrentMarketStatus", () => {
    it("fetches the current market status", async () => {
        const data = { market_type: "test", primary_exchanges: [] }; // replace with actual expected data structure
        axios.get.mockResolvedValue({ data });

        const result = await getCurrentMarketStatus();
        expect(result).toEqual(data);
        expect(axios.get).toHaveBeenCalledWith(
            `${process.env.REACT_APP_WEBSOCKET_URL}/getMarketStatus`
        );
    });

    it("handles errors correctly", async () => {
        const error = new Error("Test error");
        axios.get.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, "log");
        consoleSpy.mockImplementation(() => {});

        await getCurrentMarketStatus();
        expect(console.log).toHaveBeenCalledWith(error);

        consoleSpy.mockRestore();
    });
});
