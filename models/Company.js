import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    symbol: { type: String, unique: true },
    name: String,
    status: String,
});

const Company = mongoose.model("Company", companySchema, "companies");

export default Company;
