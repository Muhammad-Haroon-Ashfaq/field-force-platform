import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import territoryRoutes from "./routes/territoryRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads folder banana agar nahi hai
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files — uploaded images serve karne ke liye
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/activity-types", activityRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/territories", territoryRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// DB connect and server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });