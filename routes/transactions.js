import express from "express";
import buyStockFunction from "../controllers/buyStockController.js";

const transactions = express.Router();

transactions.post("/buy-stock", buyStockFunction);

export default transactions;
