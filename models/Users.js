import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    role: {
        type: String,
        enum: ["normal_user", "advanced_user"],
        default: "normal_user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailToken: {
        type: String,
        required: false,
    },
    balance: {
        type: Number,
        default: 500000, // default balance is set to 500,000
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
});

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
