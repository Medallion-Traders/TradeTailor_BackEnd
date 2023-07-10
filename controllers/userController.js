import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import UserModel from "../models/Users.js";
import sendEmail from "../utils/sendEmail.js";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req, res) => {
    try {
        console.log("Hello");
        const { email, password, username } = req.body;
        const isValidEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

        if (!isValidEmail) {
            return res.status(400).json({ message: email + " is not a valid email" });
        }

        let user = await UserModel.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        delete req.body.password;

        //implementation of email verification
        const emailToken = crypto.randomBytes(64).toString("hex");

        const newUser = new UserModel({
            email,
            password: hashedPassword,
            emailToken,
            balance: 500000, // setting initial balance to 500k
            username,
        });

        sendEmail(newUser);

        await newUser.save();
        return res.status(201).json("User registered successfully, proceed to login/verify email");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found, please register" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                message: "You must verify your email before logging in",
            });
        }

        const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        delete user.password;
        return res.status(200).json({ token, user });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const user = await UserModel.findOne({ emailToken: req.query.token });

        if (!user) {
            return res.status(400).send("Invalid token");
        }

        user.isVerified = true;
        user.emailToken = null;
        await user.save();

        return res.redirect(`${process.env.REACT_APP_URL}`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

export const getUserBalance = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching the user's balance" });
    }
};

export const resetBalance = (req, res) => {};
