import axios from "axios";
import dotenv from "dotenv";
import csvtojson from "csvtojson";

let companies = [];
let lastUpdatedTime = null;

dotenv.config();

// Check if the data needs to be fetched
function needsUpdate() {
    if (!lastUpdatedTime || companies.length === 0) {
        // If lastUpdatedTime is not set or the array is empty, update is needed
        return true;
    }
    const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const timeDifference = currentTime - lastUpdatedTime;
    const oneDayInSeconds = 24 * 60 * 60;
    return timeDifference >= oneDayInSeconds;
}

// Fetch companies' data from API
async function fetchCompanies() {
    const MAX_COUNT = 500;
    let count = 0;
    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );
        if (!response.data) {
            console.log(
                "CSV file is empty, likely query limit of alphavantage api exceeded 5 requests per minute"
            );
            return;
        }
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
        lastUpdatedTime = Math.floor(Date.now() / 1000); // Update lastUpdatedTime
    } catch (err) {
        console.error("Error fetching companies' data:", err);
    }
}

// Companies endpoint
async function populateDropDownFunction(req, res) {
    if (needsUpdate()) {
        await fetchCompanies();
    }
    res.status(200).json(companies);
}

export default populateDropDownFunction;
