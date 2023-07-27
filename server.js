//TESTING CONFIGURATION
// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import helmet from "helmet";
// import morgan from "morgan";
// import verifyToken from "./middleware/auth.js";
// import stockdata from "./routes/data.js";
// import transactions from "./routes/transactions.js";
// import users from "./routes/users.js";
// import summary from "./routes/summary.js";
// import posts from "./routes/posts.js";
// import { createServer } from "http";
// import { setupWebSocket } from "./utils/socket.js";
// import charts from "./routes/charts.js";
// import startCrons from "./utils/crons.js";
// import { initializeMarketStatus } from "./utils/queryDB.js";
// import notifications from "./routes/notifications.js";

// dotenv.config();

// // This function sets up the test user for the app to simulate JWT token usage
// function testUser(req, res, next) {
//     //email: "cortozitru@gufum.com"
//     //username: "cortozitru@gufum.com"
//     req.user = {
//         id: "64b98984f03b3d97c4781a45",
//     };
//     next();
// }

// // This function sets up all the middleware for the app
// function setupMiddleware(app) {
//     app.use(cors({ origin: process.env.REACT_APP_URL }));
//     app.use(express.json());
//     app.use(helmet());
//     app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
//     app.use(morgan("common"));
//     app.use(bodyParser.urlencoded({ extended: true }));

//     if (process.env.NODE_ENV != "production") {
//         app.use(testUser);
//     }
// }

// // This function sets up all the routes for the app
// function setupRoutes(app) {
//     app.use("/auth", users);
//     app.use("/data", stockdata);
//     app.use("/transactions", transactions);
//     app.get("/", (req, res) => res.send("Server deployed successfully"));
//     app.use("/summary", summary);
//     app.use("/charts", charts);
//     app.use("/notifications", notifications);
//     app.use("/posts", posts);
// }

// async function connectDatabase() {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         //console.log("MongoDB Connected...");
//     } catch (error) {
//         console.error("Failed to connect to MongoDB ", error);
//         process.exit(1);
//     }
// }

// async function start() {
//     const app = express();
//     setupMiddleware(app);
//     setupRoutes(app);
//     await connectDatabase();

//     const server = createServer(app);
//     await setupWebSocket(server, process.env.JWT_SECRET);

//     server.listen(process.env.PORT || 3001, () =>
//         //console.log(`SERVER STARTED ON ${process.env.REACT_APP_SERVER_URL}`)
//     );

//     //Initialize market status
//     await initializeMarketStatus();

//     // Start all the cron jobs
//     startCrons();
// }

// start();

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
import summary from "./routes/summary.js";
import posts from "./routes/posts.js";
import { createServer } from "http";
import { setupWebSocket } from "./utils/socket.js";
import charts from "./routes/charts.js";
import startCrons from "./utils/crons.js";
import { initializeMarketStatus } from "./utils/queryDB.js";
import notifications from "./routes/notifications.js";
import companiesController from "./utils/createCompaniesControllerInstance.js";

dotenv.config();

// This function sets up all the middleware for the app
function setupMiddleware(app) {
    app.use(cors({ origin: process.env.REACT_APP_URL }));
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    app.use(morgan("common"));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.json());
}

// This function sets up all the routes for the app
function setupRoutes(app) {
    app.use("/auth", users);
    app.use("/data", verifyToken, stockdata);
    app.use("/transactions", verifyToken, transactions);
    app.get("/", (req, res) => res.send("Server deployed successfully"));
    app.head("/", (req, res) => res.end());
    app.use("/summary", verifyToken, summary);
    app.use("/charts", verifyToken, charts);
    app.use("/notifications", verifyToken, notifications);
    app.use("/posts", posts);
}

async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB Connected...");
    } catch (error) {
        console.error("Failed to connect to MongoDB ", error);
        process.exit(1);
    }
}

async function start() {
    const app = express();
    setupMiddleware(app);
    setupRoutes(app);
    await connectDatabase();

    const server = createServer(app);
    await setupWebSocket(server, process.env.JWT_SECRET);

    server.listen(process.env.PORT || 3001, () =>
        console.log(`SERVER STARTED ON ${process.env.REACT_APP_SERVER_URL}`)
    );

    //Initialize market status
    await initializeMarketStatus();

    //Initialise population of companies list
    if (companiesController.needsUpdate()) {
        companiesController.fetchCompanies().catch((err) => {
            console.error("Failed to update companies data", err);
        });
    }

    // Start all the cron jobs
    startCrons();
}

start();

function printMemoryUsage() {
    const usage = process.memoryUsage();
    console.log(`Memory Usage:
    RSS ${Math.round((usage.rss / 1024 / 1024) * 100) / 100} MB
    Heap Total ${Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100} MB
    Heap Used ${Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100} MB
    External ${Math.round((usage.external / 1024 / 1024) * 100) / 100} MB`);
}

// Use the function
printMemoryUsage();
setInterval(() => {
    printMemoryUsage();
}, 10000); // Prints memory usage every 10 seconds
