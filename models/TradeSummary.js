import mongoose from "mongoose";

const TradeSummarySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        number_of_open_positions: {
            type: Number,
            default: 0,
        },
        number_of_closed_positions: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const TradeSummaryModel = mongoose.model("TradeSummary", TradeSummarySchema, "tradesummaries");

export default TradeSummaryModel;
