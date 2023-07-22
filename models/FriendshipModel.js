import mongoose from "mongoose";

const friendshipSchema = mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted"],
        required: true,
    },
});

const FriendshipModel = mongoose.model("friendships", friendshipSchema, "friendships");

export default FriendshipModel;
