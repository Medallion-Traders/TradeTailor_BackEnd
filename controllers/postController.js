import PostModel from "../models/DiscussionPost.js";
import CommentModel from "../models/DiscussionComment.js";
import UserModel from "../models/Users.js";

export const getAllPosts = async (req, res) => {
    try {
        const posts = await PostModel.find().populate("comments").sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createPost = async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    const newPost = new PostModel({
        title: req.body.title,
        body: req.body.content,
        username: user.username,
        category: req.body.category,
    });

    try {
        const savedPost = await newPost.save();
        res.status(201).json({ post: savedPost, message: "Post created successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addComment = async (req, res) => {
    const postId = req.params.postId;
    const user = await UserModel.findById(req.user.id);
    const newComment = new CommentModel({
        content: req.body.comment,
        username: user.username,
        postId: postId,
    });

    try {
        const savedComment = await newComment.save();

        // Add comment to the post's comments array
        const post = await PostModel.findById(postId);
        post.comments.push(savedComment.id);
        await post.save();

        res.status(201).json({ comment: savedComment, message: "Comment added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
