const { getUserInfo } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;

jest.mock("../../models/Users.js");

describe("getUserInfo", () => {
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

    it("should respond with user info if user is found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        const user = { id: "testId", username: "test", email: "test@test.com", about: "test" };
        UserModel.findById.mockResolvedValue(user);
        await getUserInfo(req, res);
        expect(res.json).toHaveBeenCalledWith({
            username: user.username,
            email: user.email,
            about: user.about,
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should respond with 404 if user is not found", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        UserModel.findById.mockResolvedValue(null);
        await getUserInfo(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should respond with 500 if an error occurs", async () => {
        const req = mockRequest({ id: "testId" });
        const res = mockResponse();
        UserModel.findById.mockRejectedValue(new Error("test error"));
        await getUserInfo(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "test error" });
    });
});
