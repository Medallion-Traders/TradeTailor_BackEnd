import express from "express";
import autoFillFunction from "../controllers/autofillPriceController.js";
import CompaniesController from "../controllers/populateDropDownController.js";

const stockdata = express.Router();

const companiesController = new CompaniesController();

stockdata.get("/companies", (req, res) => companiesController.populateDropDownFunction(req, res));
stockdata.get("/stock-price/:symbol", autoFillFunction);

export default stockdata;
