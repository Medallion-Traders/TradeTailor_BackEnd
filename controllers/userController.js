import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import UserModel from "../models/Users.js";
import PortfolioModel from "../models/Portfolio.js";
import PositionModel from "../models/Position.js";
import { Order } from "../models/Order.js";
import sendEmail from "../utils/sendEmail.js";
import dotenv from "dotenv";
import TradeSummaryModel from "../models/TradeSummary.js";
import DailyProfitModel from "../models/Profit.js";
import FriendshipModel from "../models/FriendshipModel.js";
import mongoose from "mongoose";
import companiesController from "../utils/createCompaniesControllerInstance.js";
import SnapshotModel from "../models/Snapshot.js";

dotenv.config();

export const registerUser = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const isValidEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

        if (!isValidEmail) {
            return res.status(400).json({ message: email + " is not a valid email" });
        }

        // Check if email is already taken
        let user = await UserModel.findOne({ email, username });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Check if username is already taken
        user = await UserModel.findOne({ username });
        if (user) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        delete req.body.password;

        //implementation of email verification
        const emailToken = crypto.randomBytes(64).toString("hex");

        const newUser = new UserModel({
            email,
            password: hashedPassword,
            emailToken,
            balance: 500000, // setting initial balance to 500k
            username,
        });

        sendEmail(newUser);

        await newUser.save();
        return res.status(201).json("User registered successfully, proceed to login/verify email");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found, please register" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                message: "You must verify your email before logging in",
            });
        }

        const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        delete user.password;

        // If login is successful, update companies data in the background
        if (companiesController.needsUpdate()) {
            companiesController.fetchCompanies().catch((err) => {
                console.error("Failed to update companies data", err);
            });
        }
        return res.status(200).json({ token, user });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const user = await UserModel.findOne({ emailToken: req.query.token });

        if (!user) {
            return res.status(400).send("Invalid token");
        }

        user.isVerified = true;
        user.emailToken = null;
        await user.save();

        return res.redirect(`${process.env.REACT_APP_URL}`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

export const getUserBalance = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);
        // console.log("user balance is @getUserBalance", user.balance);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching the user's balance" });
    }
};

export const helperBalance = async (userId) => {
    const user = await UserModel.findById(userId);
    return user.balance;
};

export const getUserInfo = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const result_object = { username: user.username, email: user.email, about: user.about };
        return res.status(200).json(result_object);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

export const updateUserSummary = async (req, res) => {
    const userId = req.user.id;
    const { about } = req.body;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (about) {
            user.about = about;
        }

        const updatedUser = await user.save();

        return res
            .status(200)
            .json({ message: "User bio updated successfully", about: updatedUser.about });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// ============================| FRIENDSHIP ROUTES |================================

export const getFriendProfile = async (req, res) => {
    try {
        const viewerId = req.user.id;
        const ownerId = req.params.id;

        // Check if a friendship exists between the viewer and the profile owner
        const friendship = await FriendshipModel.findOne({
            $or: [
                { requester: ownerId, recipient: viewerId },
                { requester: viewerId, recipient: ownerId },
            ],
            status: "Accepted",
        });
        if (!friendship && ownerId !== viewerId) {
            return res.status(403).json({ message: "You are not allowed to view this profile" });
        }

        // Get the profile owner's details
        const user = await UserModel.findById(ownerId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return only public details
        const publicDetails = {
            id: user._id,
            email: user.email,
            username: user.username,
            about: user.about,
        };
        res.status(200).json(publicDetails);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        console.log(error);
    }
};

export async function getFriendClosedPositions(req, res) {
    try {
        const viewerId = req.user.id;
        const ownerId = req.params.id;

        // Check if a friendship exists between the viewer and the profile owner
        const friendship = await FriendshipModel.findOne({
            $or: [
                { requester: ownerId, recipient: viewerId },
                { requester: viewerId, recipient: ownerId },
            ],
            status: "Accepted",
        });

        if (!friendship && ownerId !== viewerId) {
            return res.status(403).json({ message: "You are not allowed to view this profile" });
        }

        let portfolio = await PortfolioModel.findOne({ user: ownerId }).populate({
            path: "positions",
            match: { positionStatus: "closed" },
            populate: [{ path: "openingOrders" }, { path: "closingOrders" }],
        });

        if (!portfolio) {
            console.log(`No portfolio found for user ${ownerId}`);
            res.status(200).json([]);
            return;
        }

        res.status(200).json(portfolio.positions);
    } catch (err) {
        console.error(`Function getFriendClosedPositions broke and raised ${err}`);
        res.status(500).json({ error: err.toString() });
    }
}

export async function getFriends(req, res) {
    try {
        const userId = req.user.id; // The user ID should come from the token after verification
        const friendRequests = await FriendshipModel.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: "Accepted",
        })
            .populate("requester", "id username") // only return the id, username
            .populate("recipient", "id username"); // only return the id, username

        // Create an array of friend data
        const friends = friendRequests.map((request) => {
            // If the requester is the current user, return the recipient's data, otherwise, return the requester's data
            let friend =
                request.requester.id.toString() === userId
                    ? {
                          id: request.recipient.id,
                          username: request.recipient.username,
                          friendshipId: request._id,
                      }
                    : {
                          id: request.requester.id,
                          username: request.requester.username,
                          friendshipId: request._id,
                      };

            return friend;
        });

        // Send response
        res.status(200).json({ friends });
    } catch (err) {
        console.error(`Error while getting friends: ${err.message}`);
        res.status(500).json({ error: "An error occurred while getting friends" });
    }
}

export async function removeFriend(req, res) {
    try {
        const { friendshipId } = req.body;
        await FriendshipModel.findByIdAndDelete(friendshipId);
        res.status(200).json({ message: "Friend removed" });
    } catch (err) {
        console.error(`Error while removing friend: ${err.message}`);
        res.status(500).json({ error: "An error occurred while removing friend" });
    }
}

export async function getFriendRequests(req, res) {
    try {
        const userId = req.user.id; // The user ID should come from the token after verification
        const requests = await FriendshipModel.find({
            recipient: userId,
            status: "Pending",
        }).populate("requester", "id username avatar"); // only return the id, username and avatar from the requester document

        res.status(200).json({ friendRequests: requests });
    } catch (err) {
        console.error(`Error while getting friend requests: ${err.message}`);
        res.status(500).json({ error: "An error occurred while getting friend requests" });
    }
}

export async function respondToFriendRequest(req, res) {
    try {
        const requestId = req.params.requestId;
        const { response } = req.body;
        const request = await FriendshipModel.findById(requestId);

        if (!request) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        request.status = response;
        if (response === "Declined") {
            await FriendshipModel.findByIdAndRemove(requestId);
        } else {
            await request.save();
        }
        return res.status(200).json({ message: `Friend request ${response.toLowerCase()}` });
    } catch (err) {
        console.error(`Error while responding to friend request: ${err.message}`);
        res.status(500).json({ error: "An error occurred while responding to friend request" });
    }
}

export async function getNonFriends(req, res) {
    try {
        const userId = req.user.id; // The user ID should come from the token after verification
        //const allUsers = await UserModel.find({ _id: { $ne: userId } }, "id username"); // Only return the id and username fields
        const friends = await FriendshipModel.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: "Accepted",
        });

        // get an array of friend ids
        const friendIds = friends.map((f) =>
            f.requester.toString() === userId ? f.recipient._id : f.requester._id
        );

        // Add the user's own ID to friendIds
        friendIds.push(new mongoose.Types.ObjectId(userId));

        // Find users who are not in friendIds
        const nonFriends = await UserModel.find(
            {
                _id: { $nin: friendIds },
            },
            "id username"
        );

        // Add friend request status to non-friends
        const nonFriendsWithStatus = await Promise.all(
            nonFriends.map(async (user) => {
                const friendRequest = await FriendshipModel.findOne({
                    $or: [
                        { requester: userId, recipient: user._id },
                        { requester: user._id, recipient: userId },
                    ],
                });
                const userObj = user.toObject(); // convert user from Mongoose document to plain JavaScript object
                if (friendRequest) {
                    userObj.friendRequestStatus = friendRequest.status;
                    userObj.friendRequestSentByMe = friendRequest.requester.toString() === userId;
                } else {
                    userObj.friendRequestStatus = null;
                    userObj.friendRequestSentByMe = true;
                }
                return userObj;
            })
        );

        res.status(200).json({ nonFriends: nonFriendsWithStatus });
    } catch (err) {
        console.error(`Error while getting non-friends: ${err.message}`);
        res.status(500).json({ error: "An error occurred while getting non-friends" });
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const requester = req.user.id;
        const recipient = req.params.id;

        const existingFriendship = await FriendshipModel.findOne({
            $or: [
                { requester: requester, recipient: recipient },
                { requester: recipient, recipient: requester },
            ],
        });

        if (existingFriendship) {
            if (existingFriendship.status === "Pending") {
                return res.status(400).json({
                    error:
                        "A friend request is already pending. Please check your incoming requests tab",
                });
            } else {
                return res.status(400).json({ error: "You are already friends" });
            }
        }

        const newFriendship = new FriendshipModel({
            requester,
            recipient,
            status: "Pending",
        });

        await newFriendship.save();
        res.status(201).json({ message: "Friend request sent" });
    } catch (err) {
        console.error(`Error while sending friend request: ${err.message}`);
        res.status(500).json({ error: "An error occurred while sending friend request" });
    }
}

// ============================| SETTINGS ROUTES |================================
export const updateUsername = async (req, res) => {
    try {
        const { newUsername } = req.body;
        const userExists = await UserModel.findOne({ username: newUsername });

        if (userExists) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        user.username = newUsername;
        await user.save();

        res.status(200).json({ message: "Username updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid current password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

export const resetBalance = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.balance = process.env.DEFAULT_CASH_BALANCE;
        await Order.deleteMany({ user: userId });
        const portfolio = await PortfolioModel.findOne({ user: userId });

        if (portfolio) {
            const position_ids_array = portfolio.positions;

            await Promise.all(
                position_ids_array.map((position_id) =>
                    PositionModel.findByIdAndDelete(position_id)
                )
            );

            await TradeSummaryModel.deleteMany({ user: userId }).then(() => {
                console.log("Trade summary deleted");
            });
            await PortfolioModel.findByIdAndDelete(portfolio._id).then(() => {
                console.log("Portfolio summary deleted");
            });
            await DailyProfitModel.deleteMany({ user: userId }).then(() => {
                console.log("Daily Profit Model summary deleted");
            });
            await SnapshotModel.deleteOne({ user: userId }).then(() => {
                console.log("Snapshot Model deleted");
            });

            const savedUser = await user.save();
            if (!savedUser) {
                return res.status(500).json({ message: "Failed to save user" });
            }
            res.status(200).json({ message: "Portfolio successfully reset" });
            return;
        } else {
            res.status(200).json({ message: "Portfolio already reset" });
        }
    } catch (error) {
        res.status(500).json({ message: `Unexpected error: ${error.message}` });
    }
};
