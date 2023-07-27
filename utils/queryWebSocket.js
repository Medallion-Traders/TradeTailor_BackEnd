import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/*
    This function queries the websocket to get the current price of a stock
    @param {String}
    @returns {Number}
*/
async function getCurrentPrice(symbol) {
    try {
        //Query the websocket to get current_price
        const symbol_price_object = await axios
            .get(`${process.env.REACT_APP_WEBSOCKET_URL}/webSocket/price/${symbol}`)
            .catch((error) => {
                //console.log(error);
            });
        // Extract the stock price from the { symbol, price } response
        return symbol_price_object.data.price;
    } catch (e) {
        //console.log(e);
    }
}

/*
    This function queries the websocket to get the current market status
    @param 
    @returns {Object} in the form
    {
        market_type: usMarket.market_type,
        primary_exchanges: usMarket.primary_exchanges,
        local_open: usMarket.local_open,
        local_close: usMarket.local_close,
        current_status: usMarket.current_status,
        notes: usMarket.notes,
    }
*/

async function getCurrentMarketStatus() {
    try {
        //Query the websocket to get current_price
        const market_status = await axios
            .get(`${process.env.REACT_APP_WEBSOCKET_URL}/getMarketStatus`)
            .catch((error) => {
                //console.log(error);
            });

        return market_status.data;
    } catch (e) {
        //console.log(e);
    }
}

export { getCurrentPrice, getCurrentMarketStatus };
