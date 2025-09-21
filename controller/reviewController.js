import Review from "../models/review.js";
import CV from "../models/cv.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const getReviewByUser = catchAsync(async (req, res, next) => {
  // const reviews = await Review.find({ userId: req.user._id })
  //   .populate({
  //     path: "cvId",
  //     select:
  //       "firstName lastName applyingForJobRole targetMarkets serviceLevel createdAt submittedAt status ",
  //   })
  //   .sort("-createdAt");

  const reviewed = await CV.find({ userId: req.user._id, status: "reviewed" });

  res.status(200).json({
    status: "success",
    results: reviewed.length,
    data: {
      reviewed,
    },
  });
});

// Post/Upload review for a pending CV
const postReview = catchAsync(async (req, res, next) => {
  const { cvId } = req.params;
  console.log(req.body);
  // Check if CV exists and is pending with full population
  const cv = await CV.findById(cvId).populate(
    "userId",
    "firstName lastName email phoneNumber"
  );
  if (!cv) {
    return next(new AppError("CV not found", 404));
  }

  if (cv.status !== "pending") {
    return next(new AppError("Can only post reviews for pending CVs", 400));
  }

  // Check if review already exists for this CV
  const existingReview = await Review.findOne({ cvId });
  if (existingReview) {
    return next(new AppError("Review already exists for this CV", 400));
  }

  // Create review with uploaded JSON data
  const reviewData = {
    ...req.body, // The entire JSON structure is in req.body
    cvId,
    userId: cv.userId._id,
    reviewer_id: req.user._id,
    status: "completed", // Mark as completed when admin uploads
  };

  const review = await Review.create(reviewData);

  // Populate the created review with CV details
  const populatedReview = await Review.findById(review._id)
    .populate({
      path: "cvId",
      select:
        "firstName lastName applyingForJobRole targetMarkets serviceLevel yearOfBirth yearOfMedicalGraduation createdAt submittedAt status currentStep",
    })
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("reviewer_id", "firstName lastName email");

  // Update CV status to reviewed and set reviewId after posting review
  cv.status = "reviewed";
  cv.reviewId = review._id;
  await cv.save();

  res.status(201).json({
    status: "success",
    data: {
      review: populatedReview,
      cv_details: {
        submission_date: cv.createdAt,
        job_role: cv.applyingForJobRole,
        target_markets: cv.targetMarkets,
        service_level: cv.serviceLevel,
        year_of_birth: cv.yearOfBirth,
        year_of_medical_graduation: cv.yearOfMedicalGraduation,
        current_step: cv.currentStep,
        user_info: {
          name: `${cv.userId.firstName} ${cv.userId.lastName}`,
          email: cv.userId.email,
          phone: cv.userId.phoneNumber,
        },
      },
      message: "Review posted successfully for pending CV",
    },
  });
});

const getReviewById = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  // Find the review and populate related data
  const review = await Review.findById(reviewId).lean();

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  // Role-based access control
  if (req.user.role === "admin") {
    // Admin can see any review
    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } else if (req.user.role === "user") {
    // User can only see reviews for their own CVs
    if (review.userId._id.toString() !== req.user._id.toString()) {
      return next(
        new AppError("You can only access reviews for your own CVs", 403)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } else {
    return next(new AppError("Access denied", 403));
  }
});

export { postReview, getReviewByUser, getReviewById };
