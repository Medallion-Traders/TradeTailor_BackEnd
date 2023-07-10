import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/*
    This function queries the websocket to get the current price of a stock
    @param {String}
    @returns {Number}
*/
async function getCurrentPrice(ticker) {
    try {
        //Query the websocket to get current_price
        const ticker_price_object = await axios
            .get(`${process.env.REACT_APP_WEBSOCKET_URL}/webSocket/price/${ticker}`)
            .catch((error) => {
                console.log(error);
            });
        // Extract the stock price from the { ticker, price } response
        return ticker_price_object.data.price;
    } catch (e) {
        console.log(e);
    }
}

export default getCurrentPrice;
