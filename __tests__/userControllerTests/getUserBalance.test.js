const { getUserBalance } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;

jest.mock("../../models/Users.js");

describe("getUserBalance", () => {
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

    it("should return user's balance if user is found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const user = { balance: 10.1234 };
        UserModel.findById.mockResolvedValue(user);
        await getUserBalance(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ balance: 10.12 });
    });

    it("should return 404 if user is not found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        UserModel.findById.mockResolvedValue(null);
        await getUserBalance(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle an error when fetching user balance", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        UserModel.findById.mockRejectedValue(new Error("Fetching error"));
        await getUserBalance(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "An error occurred while fetching the user's balance",
        });
    });
});
