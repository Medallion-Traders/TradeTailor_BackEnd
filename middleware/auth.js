/*
  General middleware to verify token
*/
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = async (req, res, next) => {
    try {
        if (req.user) {
            // User object is already present, which means we're in a testing environment and the testUser middleware has been called
            next();
        } else {
            let token = req.headers.authorization;

            if (!token) {
                return res.status(403).json({ message: "Access Denied" });
            }

            if (!token.startsWith("Bearer ")) {
                return res.status(400).json({ message: "Invalid Token" });
            }

            token = token.slice(7, token.length).trimLeft();

            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified;
            next();
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token Expired" });
        }

        //console.log(error);
        return res.status(400).json({ message: "Internal Server Error" });
    }
};

export default verifyToken;
