import express from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
    getUserBalance,
    getUserInfo,
    updateUserSummary,
    getFriendProfile,
    getFriendClosedPositions,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    getFriendRequests,
    getFriends,
    getNonFriends,
} from "../controllers/userController.js";
import verifyToken from "../middleware/auth.js";

const users = express.Router();

users.post("/register", registerUser);
users.post("/login", loginUser);
users.get("/verify-email", verifyEmail);
users.get("/balance", verifyToken, getUserBalance);
users.get("/info", verifyToken, getUserInfo);
users.put("/update", verifyToken, updateUserSummary);
users.get("/profile/:id", verifyToken, getFriendProfile);
users.get("/profile/closed-positions/:id", verifyToken, getFriendClosedPositions);

// Friendship routes
users.get("/friends", verifyToken, getFriends); // gets all friends
users.delete("/friends/remove", verifyToken, removeFriend); // removes the friend specified in the request body
users.get("/friends/incoming", verifyToken, getFriendRequests); // gets all incoming friend requests
users.put("/friends/respond/:requestId", verifyToken, respondToFriendRequest); // responds to a friend request specified in the request body
users.post("/friends/request/:id", verifyToken, sendFriendRequest); // sends a friend request to the user specified in the request body
users.get("/friends/non-friends", verifyToken, getNonFriends); // gets all non-friends

export default users;
