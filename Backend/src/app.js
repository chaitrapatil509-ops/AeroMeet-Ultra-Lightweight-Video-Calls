import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import { json } from "node:stream/consumers";

import userRoutes from "./controllers/models/routes/users.routes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port" , (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);

app.set("port", (process.env.PORT || 8000))

app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb", extended:true}));

const start = async() => {
    app.set("mongo_user");
    const connectionDb = await mongoose.connect("mongodb://admin:admin123@ac-028gr3p-shard-00-00.qgn9nek.mongodb.net:27017,ac-028gr3p-shard-00-01.qgn9nek.mongodb.net:27017,ac-028gr3p-shard-00-02.qgn9nek.mongodb.net:27017/?ssl=true&replicaSet=atlas-dsv02p-shard-0&authSource=admin&appName=Cluster0");
    console.log(`MongoDB Connected DB Host : ${connectionDb.connection.host}`);
    server.listen(app.get("port"), ()=> {
        console.log("Listening on port 8000");
    });
}

start();