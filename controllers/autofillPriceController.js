import axios from "axios";
import dotenv from "dotenv";
import { getCurrentPrice } from "../utils/queryWebSocket.js";

dotenv.config();

// Stock price endpoint
async function autoFillFunction(req, res) {
    try {
        const { symbol } = req.params;

        // Attempt to get the current price from the websocket
        let price = await getCurrentPrice(symbol);

        // // If the websocket does not return a price, get it from the AlphaVantage API
        // if (!price) {
        //     const response = await axios.get(
        //         `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        //     );
        //     price = response.data["Global Quote"]["05. price"];
        // }

        // If there is still no price, send a 500 response
        if (!price) {
            return res.status(500).json({ error: "Failed to fetch stock price" });
        }

        // Send the stock price in the response
        return res.status(200).json({ price });
    } catch (error) {
        console.error("Error fetching stock price:", error);
        return res.status(500).json({ error: "Failed to fetch stock price" });
    }
}

export default autoFillFunction;
