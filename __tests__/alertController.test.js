const {
    getAllNotifications,
    markAllNotificationsAsRead,
} = require("../controllers/alertController.js");
const AlertModel = require("../models/Alert.js").default;

jest.mock("../models/Alert.js");

describe("Alert Controller", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: "userId" },
        };
        res = {
            status: jest.fn(function(status) {
                this.statusCode = status;
                return this;
            }),
            json: jest.fn(),
            statusCode: 200,
        };
        next = jest.fn();
    });

    describe("getAllNotifications", () => {
        it("should return all notifications", async () => {
            const alertsMock = [
                { message: "Message 1", user: "userId", isSeen: false },
                { message: "Message 2", user: "userId", isSeen: false },
            ];
            AlertModel.find.mockResolvedValueOnce(alertsMock);

            await getAllNotifications(req, res, next);

            expect(res.json).toHaveBeenCalledWith(["Message 1", "Message 2"]);
        });

        it("should return an empty array when there are no notifications", async () => {
            AlertModel.find.mockResolvedValueOnce([]);

            await getAllNotifications(req, res, next);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("handles error when AlertModel.find throws an error", async () => {
            const errorMessage = "Error finding notifications";
            AlertModel.find.mockRejectedValueOnce(new Error(errorMessage));

            await getAllNotifications(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe("markAllNotificationsAsRead", () => {
        it("should mark all notifications as viewed", async () => {
            AlertModel.updateMany.mockResolvedValueOnce();

            await markAllNotificationsAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Notifications marked as viewed" });
        });

        it("handles error when AlertModel.updateMany throws an error", async () => {
            const errorMessage = "Error updating notifications";
            AlertModel.updateMany.mockRejectedValueOnce(new Error(errorMessage));

            await markAllNotificationsAsRead(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });
});
