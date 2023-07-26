import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    symbol: String,
    name: String,
});

const Company = mongoose.model("Company", CompanySchema, "companies");

export default Company;
