import axios from "axios";
import dotenv from "dotenv";
import csvtojson from "csvtojson";
import Company from "./models/Company"; // import the Company model

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

            for (let object of jsonArray) {
                if (object.status === "Active") {
                    const company = new Company({ symbol: object.symbol, name: object.name });
                    await company.save(); // save the company to the database
                }
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
