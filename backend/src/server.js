import "dotenv/config";
import express from "express";
import cors from "cors";
import { getAggregatedHealth } from "./healthService.js";
const expressApp = express();
const serverPort = process.env.PORT || 5000;
expressApp.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
expressApp.use(express.json());
expressApp.get("/", (req, res) => {
  res.json({
    name: "Monitor",
    status: "Active",
    timestamp: new Date().toISOString()
  });
});
expressApp.get("/health", async (req, res) => {
  try {
    const healthData = await getAggregatedHealth();
    const statusCode = healthData.status === "System Operational" ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: "Nah",
      message: "Check Failed",
      timestamp: new Date().toISOString()
    });
  }
});
expressApp.listen(serverPort, () => {
  console.log(`Server Running On Port ${serverPort}`);
});
