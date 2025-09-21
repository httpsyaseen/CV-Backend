import express from "express";
import {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyUser,
  protect,
} from "../controller/authController.js";

const router = express.Router();

// Authentication routes
router.post("/signup", signUp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

// Protected routes
router.patch("/change-password", protect, changePassword);
router.get("/verify-user", protect, verifyUser);

export default router;
