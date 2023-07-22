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
            save: function() {
                this.about = req.body.about;
                delete this.save; // Delete the save method before returning the user
                return this;
            },
        };

        UserModel.findById.mockResolvedValue(user);

        await updateUserSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        // Expect updated user without methods
        expect(res.json).toHaveBeenCalledWith({ id: "testId", about: "new about" });
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
