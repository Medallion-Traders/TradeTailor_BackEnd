export const webSocketOpenedFunction = (req, res) => {
    res.status(200).json({ message: "Web socket opened" });
};
