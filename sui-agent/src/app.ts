import express, { Application } from "express";
import cors from "cors";
import v1routes from "./routes/v1";

// Initialize Express application
const app: Application = express();

// Configure middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // Enable CORS for all routes

// Mount API routes
app.use(v1routes);

export default app;
