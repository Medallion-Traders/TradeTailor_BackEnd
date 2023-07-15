import express from "express";
import { getStockPercentages } from "../controllers/dashboardCharts";

const charts = express.Router();

charts.get("/stock-percentages", getStockPercentages);

export default charts;
