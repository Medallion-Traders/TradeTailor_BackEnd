//TESTING CONFIGURATION
// import express from "express";
// import {
//     registerUser,
//     loginUser,
//     verifyEmail,
//     getUserBalance,
//     getUserInfo,
//     updateUserSummary,
//     getFriendProfile,
//     getFriendClosedPositions,
//     sendFriendRequest,
//     respondToFriendRequest,
//     removeFriend,
//     getFriendRequests,
//     getFriends,
//     getNonFriends,
//     updateUsername,
//     changePassword,
//     resetBalance,
// } from "../controllers/userController.js";
// import verifyToken from "../middleware/auth.js";

// const users = express.Router();

// users.post("/register", registerUser);
// users.post("/login", loginUser);
// users.get("/verify-email", verifyEmail);
// users.get("/balance", getUserBalance);
// users.get("/info", getUserInfo);
// users.put("/update", updateUserSummary);
// users.get("/profile/:id", getFriendProfile);
// users.get("/profile/closed-positions/:id", getFriendClosedPositions);

// // Friendship routes
// users.get("/friends", getFriends); // gets all friends
// users.delete("/friends/remove", removeFriend); // removes the friend specified in the request body
// users.get("/friends/incoming", getFriendRequests); // gets all incoming friend requests
// users.put("/friends/respond/:requestId", respondToFriendRequest); // responds to a friend request specified in the request body
// users.post("/friends/request/:id", sendFriendRequest); // sends a friend request to the user specified in the request body
// users.get("/friends/non-friends", getNonFriends); // gets all non-friends

// // Settings routes
// users.put("/update/username", updateUsername);
// users.put("/update/password", changePassword);
// users.post("/update/reset", resetBalance);

// export default users;

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
    updateUsername,
    changePassword,
    resetBalance,
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

// Settings routes
users.put("/update/username", verifyToken, updateUsername);
users.put("/update/password", verifyToken, changePassword);
users.post("/update/reset", verifyToken, resetBalance);

export default users;
