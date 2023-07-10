import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import verifyToken from "./middleware/auth.js";
import stockdata from "./routes/data.js";
import transactions from "./routes/transactions.js";
import users from "./routes/users.js";
import webSocketRouter from "./routes/webSocket.js";
import summary from "./routes/summary.js";

dotenv.config();

const { REACT_APP_URL, REACT_APP_SERVER_URL, PORT, MONGODB_URI } = process.env;

// This function sets up the test user for the app to simulate JWT token usage
function testUser(req, res, next) {
    req.user = {
        id: "649d787a295eef856036a9e6",
    };
    next();
}

// This function sets up all the middleware for the app
function setupMiddleware(app) {
    app.use(cors({ origin: REACT_APP_URL }));
    app.use(express.json());
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    app.use(morgan("common"));
    app.use(bodyParser.urlencoded({ extended: true }));

    if (process.env.NODE_ENV !== "production") {
        app.use(testUser);
    }
}

// This function sets up all the routes for the app
function setupRoutes(app) {
    app.use("/auth", users);
    app.use("/data", verifyToken, stockdata);
    app.use("/transactions", verifyToken, transactions);
    app.get("/", (req, res) => res.send("Server deployed successfully"));
    app.use("/webSocket", webSocketRouter);
    app.use("/summary", summary);
}

// This function connects to the MongoDB database
async function connectDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB Connected...");
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    }
}

// The main function that starts the app
async function start() {
    const app = express();

    setupMiddleware(app);
    setupRoutes(app);
    await connectDatabase();

    app.listen(PORT || 3001, () => console.log(`SERVER STARTED ON ${REACT_APP_SERVER_URL}`));
}

start();
