import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const webSocketOpenedFunction = async (req, res) => {
    console.log(
        `Websocket event 'on' has fired successfully and connection established to ${process.env.REACT_APP_WEBSOCKET_URL}`
    );
    const response = await axios.get(process.env.REACT_APP_WEBSOCKET_URL).catch((err) => {
        console.error(err);
        return;
    });
    console.log(response);
    res.status(200).json({ response });
};

export { webSocketOpenedFunction };
