import express from "express";
import { protect, restrictedTo } from "../controller/authController.js";
import {
  createCV,
  getPendingCVs,
  getUserPendingCVs,
} from "../controller/cvController.js";

const router = express.Router();

// All CV routes are protected - user must be authenticated
router.use(protect);

// Create CV route
router.post("/", createCV); // POST /api/v1/cv - Create new CV
router.get("/user/pending", getUserPendingCVs); // GET /api/v1/cv/user/pending - Get all pending CVs of logged in user

// Get all pending CVs route
router.get("/admin/pending", restrictedTo("admin"), getPendingCVs); // GET /api/v1/cv/pending - Get all pending CVs

export default router;
