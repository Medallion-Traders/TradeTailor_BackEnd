import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getPortfolioValue, getUnrealisedProfits } from "../controllers/summaryController.js";
import { isMarketOpen } from "./queryDB.js";

let io; // Store the io instance globally

// This function can be used to emit an event to the client from any part of your code
async function emitUpdate(event, data, room) {
    if (io) {
        io.to(room).emit(event, data);
    }
}

async function setupWebSocket(server, secretKey) {
    dotenv.config();
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

        const userId = socket.decoded?.id; // Extract the user ID from the decoded token
        if (!userId) {
            console.log("User ID not found");
            return;
        }

        // Join a room based on user ID
        socket.join(userId);
        // console.log(socket.rooms);

        socket.on("disconnect", () => {
            console.log("Client disconnected");
            // Leave the room when the client disconnects
            socket.leave(userId);
        });
    });

    // Emit updates every 5 seconds to the respective user's room
    setInterval(async () => {
        // Iterate over all connected sockets
        try {
            if (isMarketOpen()) {
                for (const [socketId, socket] of io.of("/").sockets) {
                    // Filter out the socket ID from the rooms Set, to get the user ID
                    const userId = Array.from(socket.rooms).find((id) => id !== socketId);
                    console.log("User id: ", userId);
                    if (!userId) continue;

                    // Emit updates to each user's room
                    const unrealisedProfits = await getUnrealisedProfits(userId);
                    console.log("Unrealised profits: ", unrealisedProfits);
                    const portfolioValue = await getPortfolioValue(userId);
                    console.log("Portfolio value: ", portfolioValue);

                    await emitUpdate("getUnrealisedProfits", unrealisedProfits, userId);
                    await emitUpdate("getPortfolioValue", portfolioValue, userId);
                }
            } else {
                console.log("Market is closed");
            }
        } catch (err) {
            console.log("Error in iterating over sockets");
            console.error(err);
        }
    }, 5000);
}

export { setupWebSocket, emitUpdate };
