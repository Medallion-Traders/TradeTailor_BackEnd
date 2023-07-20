import mongoose from "mongoose";

const AlertSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isSeen: {
            type: Boolean,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const AlertModel = mongoose.model("AlertSchema", AlertSchema, "alerts");

export default AlertModel;
