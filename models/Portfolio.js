import mongoose from "mongoose";

const portfolioSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        stocks: [
            {
                company: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const PortfolioModel = mongoose.model("Portfolio", portfolioSchema);

export default PortfolioModel;
