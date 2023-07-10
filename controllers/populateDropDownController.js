import axios from "axios";
import dotenv from "dotenv";
import csvtojson from "csvtojson";

let companies = [];

dotenv.config();

// Fetch companies' data from API
async function fetchCompanies() {
    const MAX_COUNT = 500;
    let count = 0;
    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );
        const jsonArray = await csvtojson().fromString(response.data);

        for (let object of jsonArray) {
            if (count >= MAX_COUNT) {
                console.log("Successfully fetched companies' data");
                break;
            } else if (object.status === "Active") {
                companies.push({ symbol: object.symbol, name: object.name });
                count++;
            }
        }
    } catch (err) {
        console.error("Error fetching companies' data:", err);
        throw err;
    }
}

// Companies endpoint
async function populateDropDownFunction(req, res) {
    await fetchCompanies();
    res.status(200).json(companies);
}

export default populateDropDownFunction;
