import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
    getTodaysOpenPositions,
    getThisMonthOpenPositions,
    getTodaysClosedPositions,
    getThisMonthClosedPositions,
    getRealisedProfits,
    getUnrealisedProfits,
    getPortfolioValue,
    initializeUnrealisedProfitsAndPortfolioValue,
    updateUnrealisedProfitsAndPortfolioValue,
} from "../controllers/summaryController.js";
import { isMarketOpen } from "./queryDB.js";

let io; // Store the io instance globally
dotenv.config();

// This function can be used to emit an event to the client from any part of your code
async function emitUpdate(event, data, room) {
    if (io) {
        io.to(room).emit(event, data);
    }
}

async function setupWebSocket(server, secretKey) {
    // Map of intervals for each user
    const userIntervals = new Map();

    io = new Server(server, {
        cors: {
            origin: process.env.REACT_APP_URL,
            methods: ["GET", "POST"],
        },
    });

    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, secretKey, (err, decoded) => {
                if (err) return next(new Error("Authentication error"));
                socket.decoded = decoded;
                next();
            });
        } else {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        //console.log("New client connected");
        try {
            const userId = socket.decoded?.id; // Extract the user ID from the decoded token
            if (!userId) {
                //console.log("User ID not found");
                return;
            }

            //Initial emits
            getTodaysOpenPositions(userId);
            getThisMonthOpenPositions(userId);
            getTodaysClosedPositions(userId);
            getThisMonthClosedPositions(userId);
            getRealisedProfits(userId);
            initializeUnrealisedProfitsAndPortfolioValue(userId);

            // Join a room based on user ID
            socket.join(userId);

            // Start interval when a client connects
            const intervalId = setInterval(async () => {
                if (!isMarketOpen()) {
                    //console.log("Market is closed");
                } else {
                    const unrealisedProfits = await getUnrealisedProfits(userId);
                    const portfolioValue = await getPortfolioValue(userId);

                    await emitUpdate("getUnrealisedProfits", unrealisedProfits, userId);
                    await emitUpdate("getPortfolioValue", portfolioValue, userId);
                }
            }, 5000);
            userIntervals.set(userId, intervalId);

            socket.on("disconnect", async () => {
                //console.log("Client disconnected");
                // Leave the room when the client disconnects
                socket.leave(userId);

                // Clear interval when the client disconnects
                clearInterval(userIntervals.get(userId));
                userIntervals.delete(userId);

                //Update the snapshot in the database
                await updateUnrealisedProfitsAndPortfolioValue(userId);
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                //console.log(err);
            } else {
                console.error(err);
            }
        }
    });
}

export { setupWebSocket, emitUpdate };
