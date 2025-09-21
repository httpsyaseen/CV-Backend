import express from "express";
import { protect, restrictedTo } from "../controller/authController.js";
import {
  postReview,
  getReviewByUser,
  getReviewById,
} from "../controller/reviewController.js";

const router = express.Router();

// All review routes are protected - user must be authenticated
router.use(protect);
router.get("/my-reviews", getReviewByUser);
router.get("/:reviewId", getReviewById); // Get review by ID - role-based access

// Post/Upload review for a pending CV (Admin only)
router.use(restrictedTo("admin"));
router.post("/cv/:cvId", postReview);

export default router;
