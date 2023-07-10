import express from "express";
import { buyStockFunction, sellStockFunction } from "../controllers/buyAndSellStockController.js";

const transactions = express.Router();

transactions.post("/buy-stock", buyStockFunction);
transactions.post("/sell-stock", sellStockFunction);

export default transactions;
