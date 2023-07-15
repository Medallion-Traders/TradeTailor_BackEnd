import express from "express";
import { stockFunction } from "../controllers/buyAndSellStockController.js";

const transactions = express.Router();

transactions.post("/order", stockFunction);

export default transactions;
