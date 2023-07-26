import axios from "axios";
import dotenv from "dotenv";
import csvtojson from "csvtojson";
import Company from "../models/Company.js"; // import the Company model

dotenv.config();

class CompaniesController {
    constructor() {
        this.lastUpdatedTime = null;
    }

    needsUpdate() {
        if (!this.lastUpdatedTime || this.companies.length === 0) {
            return true;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDifference = currentTime - this.lastUpdatedTime;
        const oneDayInSeconds = 24 * 60 * 60;
        return timeDifference >= oneDayInSeconds;
    }

    async fetchCompanies() {
        try {
            const response = await axios.get(
                `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
            );
            const jsonArray = await csvtojson().fromString(response.data);

            // Create a new set of active companies
            const activeCompanies = new Set(
                jsonArray
                    .filter((object) => object.status === "Active")
                    .map((object) => object.symbol)
            );

            // Find all companies in the database
            const companies = await Company.find();

            for (let company of companies) {
                if (activeCompanies.has(company.symbol)) {
                    // If the company is active, remove it from the set
                    activeCompanies.delete(company.symbol);
                } else {
                    // If the company is not active, delete it from the database
                    await Company.deleteOne({ _id: company._id });
                }
            }

            // The set now contains only the symbols of companies that are active but not in the database
            // Add these companies to the database
            for (let symbol of activeCompanies) {
                const object = jsonArray.find((object) => object.symbol === symbol);
                const company = new Company({ symbol: object.symbol, name: object.name });
                await company.save();
            }

            this.lastUpdatedTime = Math.floor(Date.now() / 1000);
        } catch (err) {
            console.error(err);
        }
    }

    async populateDropDownFunction(req, res) {
        if (this.needsUpdate()) {
            try {
                await this.fetchCompanies();
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }
        const companies = await Company.find(); // fetch all companies from the database
        res.status(200).json(companies);
    }
}

export default CompaniesController;
