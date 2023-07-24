import rateLimit from "express-rate-limit";

const createPostLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per window
    message: "You have exceeded the 5 posts in 1 hour limit!",
    headers: true,
});

const addCommentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per window
    message: "You have exceeded the 5 comments in 1 hour limit!",
    headers: true,
});

export { createPostLimiter, addCommentLimiter };
