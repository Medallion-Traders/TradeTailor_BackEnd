import express from "express";
import { getStockPercentages, getProfitLoss } from "../controllers/dashboardCharts.js";

const charts = express.Router();

charts.get("/stock-percentages", getStockPercentages);
charts.get("/profit-loss", getProfitLoss);

export default charts;
