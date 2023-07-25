//TESTING CONGIFURATION
// import express from "express";
// import { getAllPosts, createPost, addComment } from "../controllers/postController.js";
// import verifyToken from "../middleware/auth.js";
// import { createPostLimiter, addCommentLimiter } from "../middleware/rateLimiter.js";

// const posts = express.Router();

// posts.get("/", getAllPosts);
// posts.post("/create", createPostLimiter, createPost);
// posts.post("/:postId/comments", addCommentLimiter, addComment);

// export default posts;

import express from "express";
import { getAllPosts, createPost, addComment } from "../controllers/postController.js";
import verifyToken from "../middleware/auth.js";
import { createPostLimiter, addCommentLimiter } from "../middleware/rateLimiter.js";

const posts = express.Router();

posts.get("/", getAllPosts);
posts.post("/create", createPostLimiter, verifyToken, createPost);
posts.post("/:postId/comments", addCommentLimiter, verifyToken, addComment);

export default posts;
