import { Router } from "express";
import rootRouter from "./root";
import queryRouter from "./query";

// Create router for v1 API routes
const v1Router = Router();

// Mount route handlers
v1Router.use(rootRouter); // Basic and health check routes
v1Router.use(queryRouter); // Query handling routes

export default v1Router;
