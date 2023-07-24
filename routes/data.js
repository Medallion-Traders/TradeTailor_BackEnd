import express from "express";
import autoFillFunction from "../controllers/autofillPriceController.js";
import companiesController from "../utils/createCompaniesControllerInstance.js";

const stockdata = express.Router();

stockdata.get("/companies", (req, res) => companiesController.populateDropDownFunction(req, res));
stockdata.get("/stock-price/:symbol", autoFillFunction);

export default stockdata;
