const { loginUser } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;
const bcrypt = require("bcrypt");

jest.mock("../../models/Users.js");

describe("loginUser", () => {
    const mockRequest = (body) => ({
        body,
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

    it("should login a user", async () => {
        const req = mockRequest({ email: "test@example.com", password: "password123" });
        const res = mockResponse();
        const user = {
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            isVerified: true,
        };
        UserModel.findOne.mockResolvedValue(user);
        await loginUser(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
    });

    it("should fail to login a non-existing user", async () => {
        const req = mockRequest({ email: "test@example.com", password: "password123" });
        const res = mockResponse();
        UserModel.findOne.mockResolvedValue(null);
        await loginUser(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found, please register" });
    });

    it("should fail to login a user with incorrect password", async () => {
        const req = mockRequest({ email: "test@example.com", password: "wrongPassword" });
        const res = mockResponse();
        const user = {
            email: "test@example.com",
            password: await bcrypt.hash("password123", 10),
            isVerified: true,
        };
        UserModel.findOne.mockResolvedValue(user);
        await loginUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });
});
