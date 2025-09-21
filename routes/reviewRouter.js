import express from "express";
import { protect, restrictedTo } from "../controller/authController.js";
import { postReview, getReviewByUser } from "../controller/reviewController.js";

const router = express.Router();

// All review routes are protected - user must be authenticated
router.use(protect);
router.get("/my-reviews", getReviewByUser);

// Post/Upload review for a pending CV (Admin only)
router.use(restrictedTo("admin"));
router.post("/cv/:cvId", postReview);

export default router;
