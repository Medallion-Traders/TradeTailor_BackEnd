import express from "express";
import { getAllNotifications, markAllNotificationsAsRead } from "../controllers/alertController.js";
import verifyToken from "../middleware/auth.js";

const notifications = express.Router();

notifications.get("/getAllNotifications", verifyToken, getAllNotifications);
notifications.get("/markAllNotificationsAsRead", verifyToken, markAllNotificationsAsRead);

export default notifications;
