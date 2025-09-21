import express from "express";
import { getDashboardStats } from "../controller/adminController.js";
import { protect, restrictedTo } from "../controller/authController.js";

const router = express.Router();

// Admin routes - protected with authentication
router.get(
  "/dashboard-stats",
  protect,
  restrictedTo("admin"),
  getDashboardStats
);

export default router;
