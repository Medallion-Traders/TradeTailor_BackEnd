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

// Companies endpoint
export const populateDropDownFunction = (req, res) => {
    res.status(200).json(companies);
};

export default populateDropDownFunction;
