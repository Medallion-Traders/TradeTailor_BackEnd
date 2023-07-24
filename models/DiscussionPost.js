import mongoose from "mongoose";

const postSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["Stocks", "Strategies", "General"],
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const PostModel = mongoose.model("Post", postSchema);

export default PostModel;
