import { webSocketOpenedFunction } from "../controllers/webSocketOpened.js";
import express from "express";

const webSocketRouter = express.Router();

webSocketRouter.get("/", webSocketOpenedFunction);

export default webSocketRouter;
