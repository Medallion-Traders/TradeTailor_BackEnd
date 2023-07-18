const { updateUserSummary } = require("../../controllers/userController.js");
const UserModel = require("../../models/Users.js").default;

jest.mock("../../models/Users.js");

describe("updateUserSummary", () => {
    const mockRequest = (user, body) => ({
        user,
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

    it("should update user's about if user is found", async () => {
        const req = mockRequest({ id: "testId" }, { about: "new about" });
        const res = mockResponse();
        const user = {
            id: "testId",
            about: "old about",
            save: jest.fn().mockResolvedValue(true),
        };
        UserModel.findById.mockResolvedValue(user);
        await updateUserSummary(req, res);
        expect(user.about).toEqual(req.body.about);
        expect(user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should return 404 if user is not found", async () => {
        const req = mockRequest({ id: "testId" }, { about: "new about" });
        const res = mockResponse();
        UserModel.findById.mockResolvedValue(null);
        await updateUserSummary(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle an error when updating user summary", async () => {
        const req = mockRequest({ id: "testId" }, { about: "new about" });
        const res = mockResponse();
        UserModel.findById.mockRejectedValue(new Error("Updating error"));
        await updateUserSummary(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: new Error("Updating error").message });
    });
});
