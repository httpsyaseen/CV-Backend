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

export { getDashboardStats };
