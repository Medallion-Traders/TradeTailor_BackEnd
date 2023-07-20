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

    // You can add as many event handlers as you need here.
    io.on("connection", (socket) => {
        console.log("New client connected");

        try {
            const userId = socket.decoded?.id; // Extract the user ID from the decoded token
            if (!userId) {
                console.log("User ID not found");
                return;
            }
            getTodaysOpenPositions(userId);
            getThisMonthOpenPositions(userId);
            getRealisedProfits(userId);

            // Join a room based on user ID
            socket.join(userId);

            //Initial emits
            getTodaysOpenPositions(userId);
            getThisMonthOpenPositions(userId);
            getTodaysClosedPositions(userId);
            getThisMonthClosedPositions(userId);
            getRealisedProfits(userId);
            initializeUnrealisedProfitsAndPortfolioValue(userId);

            // Start interval when a client connects
            const intervalId = setInterval(async () => {
                if (!isMarketOpen()) {
                    console.log("Market is closed");
                } else {
                    const unrealisedProfits = await getUnrealisedProfits(userId);
                    console.log("Unrealised profits: ", unrealisedProfits);
                    const portfolioValue = await getPortfolioValue(userId);
                    console.log("Portfolio value: ", portfolioValue);

                    await emitUpdate("getUnrealisedProfits", unrealisedProfits, userId);
                    await emitUpdate("getPortfolioValue", portfolioValue, userId);
                }
            }, 5000);
            userIntervals.set(userId, intervalId);

            socket.on("disconnect", () => {
                console.log("Client disconnected");
                // Leave the room when the client disconnects
                socket.leave(userId);

                //Update the snapshot in the database
                updateUnrealisedProfitsAndPortfolioValue(userId);
            });
        } catch (err) {
            //console.log(err);
            if (axios.isAxiosError(err)) {
                console.log(err);
            } else {
                console.error(err);
            }
        }
    });
}

export { setupWebSocket, emitUpdate };
