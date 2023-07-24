import mongoose from "mongoose";

const ProfitSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        //In YYYY-MM-DD format
        date: {
            type: Date,
            required: true,
        },
        profit: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const DailyProfitModel = mongoose.model("ProfitSchema", ProfitSchema, "profits");

export default DailyProfitModel;
