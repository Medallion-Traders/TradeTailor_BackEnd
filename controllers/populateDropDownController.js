import axios from "axios";
import dotenv from "dotenv";
import XLSX from "xlsx";
import Company from "../models/Company.js";

dotenv.config();

class CompaniesController {
    constructor() {
        this.lastUpdatedTime = null;
    }

    needsUpdate() {
        if (!this.lastUpdatedTime) {
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
                `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
                { responseType: "arraybuffer" }
            );

            const workbook = XLSX.read(response.data, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonArray = XLSX.utils.sheet_to_json(worksheet);

            const bulkOps = jsonArray.map((object) => ({
                updateOne: {
                    filter: { symbol: object.symbol },
                    update: { symbol: object.symbol, name: object.name, status: object.status },
                    upsert: true,
                },
            }));

            // If status is not 'Active', remove it
            const inactiveSymbols = jsonArray
                .filter((object) => object.status !== "Active")
                .map((object) => object.symbol);

            if (inactiveSymbols.length > 0) {
                bulkOps.push({
                    deleteMany: {
                        filter: { symbol: { $in: inactiveSymbols } },
                    },
                });
            }

            // Run the operations
            await Company.bulkWrite(bulkOps)
                .then((input) => {
                    console.log("Builk write to database of companies success");
                })
                .catch((err) => {
                    console.log(err);
                });

            this.lastUpdatedTime = Math.floor(Date.now() / 1000);
        } catch (err) {
            console.log(err);
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
        const companies = await Company.find({});
        res.status(200).json(companies);
    }
}

export default CompaniesController;
