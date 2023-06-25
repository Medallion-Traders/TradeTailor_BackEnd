import mongoose from "mongoose";

const transactionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel", // The model name that userSchema is registered with
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
    },
    {
        timestamps: true, // This will add 'createdAt' and 'updatedAt' fields
    }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);

export default TransactionModel;
