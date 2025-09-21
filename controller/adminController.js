import CV from "../models/cv.js";
import Review from "../models/review.js";

import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// Get dashboard statistics
const getDashboardStats = catchAsync(async (req, res, next) => {
  // Get total CVs count
  const totalCVs = await CV.countDocuments();

  // Get total pending CVs count
  const totalPendingCVs = await CV.countDocuments({ status: "pending" });

  // Get total reviews count
  const totalReviews = await Review.countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      total_cvs: totalCVs,
      total_pending_cvs: totalPendingCVs,
      total_reviews: totalReviews,
    },
  });
});

const getAllCVS = catchAsync(async (req, res, next) => {
  const cvs = await CV.find()
    .populate("userId", "firstName lastName email")
    .lean();

  res.status(200).json({
    status: "success",
    results: cvs.length,
    data: {
      cvs,
    },
  });
});

const getAllReviewedCVS = catchAsync(async (req, res, next) => {
  const cvs = await CV.find({ status: "reviewed" })
    .populate("userId", "firstName lastName email")
    .lean();

  res.status(200).json({
    status: "success",
    results: cvs.length,
    data: {
      cvs,
    },
  });
});

export { getDashboardStats, getAllCVS, getAllReviewedCVS };
