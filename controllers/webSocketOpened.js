import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const webSocketOpenedFunction = async (req, res) => {
    console.log(
        `Websocket event 'on' has fired successfully and connection established to ${process.env.REACT_APP_WEBSOCKET_URL}`
    );
    await axios
        .get(process.env.REACT_APP_WEBSOCKET_URL)
        .then((incoming) => {
            res.status(200).json({
                message: `Websocket event 'on' has fired successfully and connection established to ${process.env.REACT_APP_WEBSOCKET_URL}`,
            });
        })
        .catch((err) => {
            if (axios.isAxiosError(err)) {
                console.log("Error connecting to websocket server, connection terminated");
                return res.status(500).json({
                    message: "Error connecting to websocket server, connection terminated",
                });
            } else {
                console.log("Some other error occurred in websocket server");
                return res.status(500).json({
                    message: "Some other error occurred in websocket server",
                });
            }
        });
};

export { webSocketOpenedFunction };
