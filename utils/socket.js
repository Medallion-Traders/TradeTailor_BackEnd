import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

let io; // Store the io instance globally

// This function can be used to emit an event to the client from any part of your code
async function emitUpdate(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

async function setupWebSocket(server, secretKey) {
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
    });
}

export { setupWebSocket, emitUpdate };
