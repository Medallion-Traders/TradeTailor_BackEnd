const { verifyEmail } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;

jest.mock("../../models/Users.js");

describe("verifyEmail", () => {
    const mockRequest = (query) => ({
        query,
    });

    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.redirect = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should verify a user's email", async () => {
        const req = mockRequest({ token: "testToken" });
        const res = mockResponse();
        const saveFn = jest.fn().mockResolvedValue(true);
        const user = { isVerified: false, emailToken: "testToken", save: saveFn };
        UserModel.findOne.mockResolvedValue(user);
        await verifyEmail(req, res);
        expect(saveFn).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalled();
    });

    it("should fail to verify an email with invalid token or token used more than once", async () => {
        const req = mockRequest({ token: "testToken" });
        const res = mockResponse();
        UserModel.findOne.mockResolvedValue(null);
        await verifyEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("Invalid token");
    });

    it("should handle an error when saving a user", async () => {
        const req = mockRequest({ token: "testToken" });
        const res = mockResponse();
        const saveFn = jest.fn().mockRejectedValue(new Error("save error"));
        const user = { isVerified: false, emailToken: "testToken", save: saveFn };
        UserModel.findOne.mockResolvedValue(user);
        await verifyEmail(req, res);
        expect(saveFn).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });
});
