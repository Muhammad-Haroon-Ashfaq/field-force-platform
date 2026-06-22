import express from "express";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;