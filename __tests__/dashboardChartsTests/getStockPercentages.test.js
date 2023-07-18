const { getStockPercentages } = require("../../controllers/dashboardCharts.js");
const PortfolioModel = require("../../models/Portfolio.js").default;

jest.mock("../../models/Portfolio.js");
jest.mock("../../models/Profit.js");

describe("getStockPercentages", () => {
    const mockRequest = (user) => ({
        user,
    });

    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should filter for open positions and performs stock percentages calculations correctly", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const positions = [
            { symbol: "A", totalAmount: 100, positionStatus: "open" },
            { symbol: "B", totalAmount: 200, positionStatus: "open" },
            { symbol: "C", totalAmount: 300, positionStatus: "closed" },
        ];
        PortfolioModel.find.mockImplementation(() => ({
            populate: () => Promise.resolve({ positions: positions }),
        }));

        await getStockPercentages(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { stock: "A", percentage: 33.33 },
            { stock: "B", percentage: 66.67 },
        ]);
    });

    it("should return empty array if user has no positions", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const positions = [];
        PortfolioModel.find.mockImplementation(() => ({
            populate: () => Promise.resolve({ positions: positions }),
        }));

        await getStockPercentages(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return empty array if user has no open positions", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const positions = [
            { symbol: "A", totalAmount: 100, positionStatus: "closed" },
            { symbol: "B", totalAmount: 200, positionStatus: "closed" },
            { symbol: "C", totalAmount: 300, positionStatus: "closed" },
        ];
        PortfolioModel.find.mockImplementation(() => ({
            populate: () => Promise.resolve({ positions: positions }),
        }));

        await getStockPercentages(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error in getStockPercentages", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();

        PortfolioModel.find.mockImplementation(() => ({
            populate: () => Promise.reject(new Error("Error")),
        }));

        await getStockPercentages(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error" });
    });
});
