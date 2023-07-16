import express from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
    getUserBalance,
    getUserInfo,
    updateUserSummary,
} from "../controllers/userController.js";
import verifyToken from "../middleware/auth.js";

const users = express.Router();

users.post("/register", registerUser);
users.post("/login", loginUser);
users.get("/verify-email", verifyEmail);
users.get("/balance", verifyToken, getUserBalance);
users.get("/info", verifyToken, getUserInfo);
users.put("/update", verifyToken, updateUserSummary);

export default users;
