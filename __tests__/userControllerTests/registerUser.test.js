const { registerUser } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;
const sendEmail = require("../../utils/sendEmail.js").default;

jest.mock("../../models/Users.js");
jest.mock("../../utils/sendEmail.js");

describe("registerUser", () => {
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

    it("should register a new user", async () => {
        const req = mockRequest({
            email: "test@example.com",
            password: "password123",
            username: "tester123456",
        });
        const res = mockResponse();
        const saveFn = jest.fn();
        UserModel.findOne.mockResolvedValue(null);
        UserModel.mockImplementation(() => ({ save: saveFn }));
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            "User registered successfully, proceed to login/verify email"
        );
        expect(saveFn).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
    });

    it("should fail to register a user with invalid email", async () => {
        const req = mockRequest({
            email: "invalidEmail",
            password: "password123",
            username: "tester123456",
        });
        const res = mockResponse();
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "invalidEmail is not a valid email" });
    });

    it("should fail to register a user with an existing email", async () => {
        const req = mockRequest({
            email: "test@example.com",
            password: "password123",
            username: "tester123456",
        });
        const res = mockResponse();
        UserModel.findOne.mockResolvedValue({ email: "test@example.com" });
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });

    it("should fail to register a user with an existing username", async () => {
        const req = mockRequest({
            email: "test@example.com",
            password: "password123",
            username: "tester123456",
        });
        const res = mockResponse();
        UserModel.findOne.mockResolvedValue({ username: "tester123456" });
        await registerUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });
});
