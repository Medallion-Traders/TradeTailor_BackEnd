import mongoose from "mongoose";

const limitOrderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        company: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        orderType: {
            type: String,
            required: true,
        },
        limitPrice: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const LimitOrderModel = mongoose.model("LimitOrder", limitOrderSchema);

export default LimitOrderModel;
