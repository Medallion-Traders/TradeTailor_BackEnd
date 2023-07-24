import express from "express";
import { getAllNotifications, markAllNotificationsAsRead } from "../controllers/alertController.js";

const notifications = express.Router();

notifications.get("/getAllNotifications", getAllNotifications);
notifications.patch("/markAllNotificationsAsRead", markAllNotificationsAsRead);

export default notifications;
