import mongoose from "mongoose";

const PortfolioSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        positions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PositionModel",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const PortfolioModel = mongoose.model("PortfolioModel", PortfolioSchema);

export default PortfolioModel;
