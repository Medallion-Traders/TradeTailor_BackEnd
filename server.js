import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import users from "./routes/users.js";
import transactions from "./routes/data.js";
import verifyToken from "./middleware/auth.js";

dotenv.config();

const { REACT_APP_URL, REACT_APP_SERVER_URL, PORT, MONGODB_URI } = process.env;

// This function sets up all the middleware for the app
function setupMiddleware(app) {
    app.use(cors({ origin: REACT_APP_URL }));
    app.use(express.json());
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    app.use(morgan("common"));
    app.use(bodyParser.urlencoded({ extended: true }));
}

// This function sets up all the routes for the app
function setupRoutes(app) {
    app.use("/auth", users);
    app.use("/api", verifyToken, transactions);
    app.get("/", (req, res) => res.send("Server deployed successfully"));
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
