import express from "express";
import {
  getDashboardStats,
  getAllCVS,
  getAllReviewedCVS,
} from "../controller/adminController.js";
import { protect, restrictedTo } from "../controller/authController.js";

const router = express.Router();

// Admin routes - protected with authentication
router.get(
  "/dashboard-stats",
  protect,
  restrictedTo("admin"),
  getDashboardStats
);

router.get("/all-cvs", protect, restrictedTo("admin"), getAllCVS);

router.get("/reviewed-cvs", protect, restrictedTo("admin"), getAllReviewedCVS);

export default router;
