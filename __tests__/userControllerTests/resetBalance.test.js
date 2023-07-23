const { resetBalance } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;
const { Order } = require("../../models/Order.js");
const PortfolioModel = require("../../models/Portfolio.js").default;
const PositionModel = require("../../models/Position.js").default;
const dotenv = require("dotenv");

dotenv.config();

jest.mock("../../models/Users.js");
jest.mock("../../models/Order.js");
jest.mock("../../models/Portfolio.js");
jest.mock("../../models/Position.js");
jest.mock("../../models/TradeSummary.js");

describe("resetBalance", () => {
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

    it("should reset balance if user is found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const user = { id: "testId", balance: 10000 };
        UserModel.findById.mockResolvedValue(user);
        Order.deleteMany.mockResolvedValue(true);
        PortfolioModel.findOne.mockResolvedValue({ positions: [] });
        await resetBalance(req, res);
        expect(user.balance).toEqual(process.env.DEFAULT_CASH_BALANCE);
    });

    it("should handle an error when resetting balance", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        UserModel.findById.mockRejectedValue(new Error("resetting error"));
        await resetBalance(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Unexpected error: resetting error",
        });
    });

    it("should delete positions if user is found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const user = { id: "testId", balance: 10000 };
        UserModel.findById.mockResolvedValue(user);
        Order.deleteMany.mockResolvedValue(true);
        const portfolio = {
            _id: "portfolioId",
            positions: ["position1", "position2"],
            user: "testId",
        };
        PortfolioModel.findOne.mockResolvedValue(portfolio);
        PositionModel.findByIdAndDelete.mockResolvedValue(true);
        await resetBalance(req, res);
        for (let i = 0; i < portfolio.positions.length; i++) {
            expect(PositionModel.findByIdAndDelete).toHaveBeenNthCalledWith(
                i + 1,
                portfolio.positions[i]
            );
        }
        expect(PortfolioModel.findByIdAndDelete).toHaveBeenCalledWith(portfolio._id);
    });
});
