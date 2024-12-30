import cookieParser from "cookie-parser";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { setupChangeStreams } from "./changeStreams.js";
import connectDB from "./config/database.js";
import initializeAdmin from "./initAdmin.js";
import eventRouter from "./routes/eventRoutes.js";
import userRouter from "./routes/userRoutes.js";

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

const PORT = process.env.PORT || 8080;


connectDB();

mongoose.connection.once("open", async () => {
  console.log("MongoDB connected, setting up Change Streams...");
  setupChangeStreams();
  await initializeAdmin();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use((req, res, next) => {
  setTimeout(() => {
    next();
  }, 0);
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/users", userRouter);
app.use("/events", eventRouter);

app.all("/*", (req, res) => {
  res.status(404).send("API Not found");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is successfully running, and server is listening on port " + PORT
    );
  } else {
    console.log("Error occurred, server can't start", error);
  }
});

export { io };

