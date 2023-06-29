import mongoose from "mongoose";

const OrderSchema = mongoose.Schema(
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
        totalAmount: {
            type: Number,
            required: true,
        },
        unitPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["open", "pending", "closed"],
            default: "open",
        },
        profit: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // This will add 'createdAt' and 'updatedAt' fields
    }
);

const LimitOrderModel = mongoose.model("LimitOrder", OrderSchema);
const MarketOrderModel = mongoose.model("MarketOrder", OrderSchema);

export { LimitOrderModel, MarketOrderModel };
