const { getProfitLoss } = require("../../controllers/dashboardCharts.js");
const DailyProfitModel = require("../../models/Profit.js").default;
const moment = require("moment");

jest.mock("../../models/Profit.js");
jest.mock("moment");

describe("getProfitLoss", () => {
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

    it("should sort the dates correctly", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const startDate = "2022-01-01";
        const profits = [
            { date: startDate, profit: 100 },
            { date: "2022-01-03", profit: 200 },
            { date: "2022-01-02", profit: 300 },
        ];
        moment.mockImplementation(() => ({
            subtract: jest.fn().mockReturnThis(),
            toDate: jest.fn().mockReturnValue(new Date(startDate)),
            toISOString: jest.fn().mockReturnValue(startDate),
        }));

        DailyProfitModel.find.mockResolvedValue(profits);

        await getProfitLoss(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { x: profits[0].date, y: 100 },
            { x: profits[1].date, y: 200 },
            { x: profits[2].date, y: -100 },
        ]);
    });

    it("should return single entry with today's date is returned if the user checks charts after first day of trading after 6am Singapore time", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const startDate = "2022-01-01";
        const profits = [{ date: startDate, profit: 100 }];
        moment.mockImplementation(() => ({
            subtract: jest.fn().mockReturnThis(),
            toDate: jest.fn().mockReturnValue(new Date(startDate)),
            toISOString: jest.fn().mockReturnValue(startDate),
        }));

        DailyProfitModel.find.mockResolvedValue(profits);

        await getProfitLoss(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ x: "2022-01-01", y: 100 }]);
    });

    it("should return empty array if user checks charts before first day of trading before 6am Singapore time", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const startDate = "2022-01-01";
        const profits = [];
        moment.mockImplementation(() => ({
            subtract: jest.fn().mockReturnThis(),
            toDate: jest.fn().mockReturnValue(new Date(startDate)),
            toISOString: jest.fn().mockReturnValue(startDate),
        }));

        DailyProfitModel.find.mockResolvedValue(profits);

        await getProfitLoss(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error in getProfitLoss", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        DailyProfitModel.find.mockRejectedValue(new Error("Error"));

        await getProfitLoss(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error" });
    });
});
