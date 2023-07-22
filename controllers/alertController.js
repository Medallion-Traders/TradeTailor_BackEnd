import AlertModel from "../models/Alert.js";

// Fetch all notifications
async function getAllNotifications(req, res) {
    try {
        const alerts = await AlertModel.find({ user: req.user.id, isSeen: false });
        const messages = alerts.map((alert) => alert.message);
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Mark notifications as viewed
async function markAllNotificationsAsRead(req, res) {
    try {
        await AlertModel.updateMany({ user: req.user.id }, { isSeen: true });
        res.status(200).json({ message: "Notifications marked as viewed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export { getAllNotifications, markAllNotificationsAsRead };
