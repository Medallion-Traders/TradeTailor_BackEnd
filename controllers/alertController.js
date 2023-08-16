import AlertModel from "../models/Alert.js";

// Fetch all notifications
async function getAllNotifications(req, res) {
    try {
        const alerts = await AlertModel.find({ user: req.user.id });

        const f_alerts = alerts.map((alert) => ({
            title: alert.title,
            description: alert.description,
            status: alert.status,
        }));
        console.log(f_alerts);
        res.status(200).json(f_alerts);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

// Mark notifications as viewed
async function markAllNotificationsAsRead(req, res) {
    try {
        await AlertModel.updateMany({ user: req.user.id }, { status: "read" });
        res.status(200).json({ message: "Notifications marked as viewed" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

export { getAllNotifications, markAllNotificationsAsRead };
