import express from "express";
import { getCurrentMarketStatusEndpoint } from "../utils/queryWebSocket.js";

const status = express.Router();

status.get("/", getCurrentMarketStatusEndpoint);

export default status;
