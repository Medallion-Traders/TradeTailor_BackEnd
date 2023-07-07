import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import users from "./routes/users.js";
import transactions from "./routes/transactions.js";
import verifyToken from "./middleware/auth.js";
import stockdata from "./routes/data.js";

const app = express();

dotenv.config();

/* CONFIGURATION */
app.use(
    cors({
        origin: process.env.REACT_APP_URL,
    })
);
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: true }));

/* ROUTES */
app.use("/auth", users);
app.use("/data", verifyToken, stockdata);
app.use("/transactions", verifyToken, transactions);

/* SERVER SUCCESSFUL DEPLOYMENT*/
app.get("/", function (request, response) {
    response.send("Server Started Successfully");
});

const uri = process.env.MONGODB_URI;

mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected..."))
    .catch((err) => console.log(err));

app.listen(process.env.PORT || 3001, () =>
    console.log(`SERVER STARTED ON ${process.env.REACT_APP_SERVER_URL}`)
);
