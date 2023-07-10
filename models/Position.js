import mongoose from "mongoose";

const PositionSchema = mongoose.Schema(
    {
        ticker: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        averagePrice: {
            type: Number,
            required: true,
        },
        positionType: {
            type: String,
            enum: ["long", "short"],
            required: true,
        },
        openingOrders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
                required: true,
            },
        ],
        closingOrders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
            },
        ],
        profit: {
            type: Number,
            default: 0,
        },
        positionStatus: {
            type: String,
            enum: ["closed", "open"],
            default: "open",
        },
    },
    {
        timestamps: true,
    }
);

const PositionModel = mongoose.model("PositionModel", PositionSchema);

export default PositionModel;
