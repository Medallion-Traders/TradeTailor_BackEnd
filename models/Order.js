import mongoose from "mongoose";

const OrderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        symbol: {
            type: String,
            required: true,
        },
        fixedQuantity: {
            type: Number,
            required: true,
        },
        currentQuantity: {
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
        filledStatus: {
            type: String,
            enum: ["pending", "filled", "cancelled"],
        },
        marketStatus: {
            type: String,
            enum: ["undefined", "open", "closed"],
        },
        direction: {
            type: String,
            enum: ["long", "short"],
        },
    },
    {
        timestamps: true, // This will add 'createdAt' and 'updatedAt' fields
    }
);

const Order = mongoose.model("Order", OrderSchema, "orders");

export { Order };
