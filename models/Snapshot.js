import mongoose from "mongoose";

const SnapshotSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        lastPortfolioValue: {
            type: Number,
            required: true,
        },
        lastUnrealisedProfit: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const SnapshotModel = mongoose.model("SnapshotSchema", SnapshotSchema, "snapshots");

export default SnapshotModel;
