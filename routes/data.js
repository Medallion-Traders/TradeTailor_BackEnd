import express from "express";
import autoFillFunction from "../controllers/autofillPriceController.js";
import populateDropDownFunction from "../controllers/populateDropDownController.js";

const stockdata = express.Router();

stockdata.get("/companies", populateDropDownFunction);
stockdata.get("/stock-price/:companyId", autoFillFunction);

export default stockdata;
