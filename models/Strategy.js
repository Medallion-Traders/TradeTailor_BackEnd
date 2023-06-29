import mongoose from "mongoose";

const strategySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        rules: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const StrategyModel = mongoose.model("Strategy", strategySchema);

export default StrategyModel;
