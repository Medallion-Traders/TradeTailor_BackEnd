import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const CommentModel = mongoose.model("Comment", commentSchema);

export default CommentModel;
