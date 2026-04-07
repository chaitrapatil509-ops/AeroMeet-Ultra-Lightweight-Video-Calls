import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./controllers/models/routes/users.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// Standard Settings
const PORT = process.env.PORT || 8000;
app.set("port", PORT);

// Middleware
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// Database Connection & Server Start
const start = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI not defined in environment");
        }
        
        const connectionDb = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${connectionDb.connection.host}`);
        
        server.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
}

start();