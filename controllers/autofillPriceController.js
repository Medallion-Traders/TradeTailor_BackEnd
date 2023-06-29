import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Companies data
const companies = [
    { id: "1", name: "Apple", symbol: "AAPL" },
    { id: "2", name: "Google", symbol: "GOOGL" },
    { id: "3", name: "Microsoft", symbol: "MSFT" },
    { id: "4", name: "Amazon", symbol: "AMZN" },
    { id: "5", name: "Meta Platforms Inc", symbol: "META" },
    { id: "6", name: "Tesla", symbol: "TSLA" },
    { id: "7", name: "Netflix", symbol: "NFLX" },
    { id: "8", name: "IBM", symbol: "IBM" },
    { id: "9", name: "Intel", symbol: "INTC" },
    { id: "10", name: "Adobe", symbol: "ADBE" },
    // Add more companies as needed
];

// Stock price endpoint
export const autoFillFunction = async (req, res) => {
    // Find the company in our data that matches the ID from the URL
    const company = companies.find((c) => c.id === req.params.companyId);

    if (!company) {
        // If we couldn't find a company with the provided ID, send a 404 response
        res.status(404).json({ error: "Company not found" });
        return;
    }

    try {
        // Make a request to the Alpha Vantage API to get the stock price
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${company.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );

        // Extract the stock price from the Alpha Vantage API response
        const price = response.data["Global Quote"]["05. price"];

        // Send the stock price in the response
        res.status(200).json({ price });
    } catch (error) {
        console.error("Error fetching stock price:", error);
        res.status(500).json({ error: "Failed to fetch stock price" });
    }
};

export default autoFillFunction;
