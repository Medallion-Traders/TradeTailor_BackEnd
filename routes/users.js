import express from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
    getUserBalance,
} from "../controllers/userController.js";
import verifyToken from "../middleware/auth.js";

const users = express.Router();

users.post("/register", registerUser);
users.post("/login", loginUser);
users.get("/verify-email", verifyEmail);
users.get("/balance", getUserBalance);

export default users;
