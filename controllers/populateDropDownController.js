import axios from "axios";
import dotenv from "dotenv";
import XLSX from "xlsx";

dotenv.config();

class CompaniesController {
    constructor() {
        this.companies = [];
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
                `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
                { responseType: "arraybuffer" }
            );

            // Parse the Excel data
            const workbook = XLSX.read(response.data, { type: "buffer" });

            // Assuming the data is on the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert the worksheet to JSON
            const jsonArray = XLSX.utils.sheet_to_json(worksheet);

            for (let object of jsonArray) {
                if (object.status === "Active") {
                    this.companies.push({ symbol: object.symbol, name: object.name });
                }
            }
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
        res.status(200).json(this.companies);
    }
}

export default CompaniesController;
