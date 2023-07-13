import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// project imports
import { getPortfolioValue, getUnrealizedProfits } from "../controllers/realTimeDataController.js";

const setupWebSocket = (server, secretKey) => {
    dotenv.config();
    const io = new Server(server, {
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

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });

        // Send different types of data over the same connection
        setInterval(() => {
            socket.emit("getPortfolioValue", getPortfolioValue());
            socket.emit("getUnrealizedProfits", getUnrealizedProfits());
        }, 1000);
    });
};

export default setupWebSocket;
