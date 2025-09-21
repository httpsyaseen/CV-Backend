import CV from "../models/cv.js";
import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";

// Create a new CV
const createCV = catchAsync(async (req, res, next) => {
  // Ensure user can only create CV for themselves

  console.log(req.body);
  const cvData = { ...req.body, userId: req.user._id };

  const cv = await CV.create(cvData);

  // Add CV reference to user's cvs array
  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { cvs: cv._id } },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    data: {
      cv,
    },
  });
});

// Get all pending CVs (for admin/reviewers)
const getPendingCVs = catchAsync(async (req, res, next) => {
  const cvs = await CV.find({ status: "pending" }).populate(
    "userId",
    "firstName lastName email"
  );

  res.status(200).json({
    status: "success",
    results: cvs.length,
    data: {
      cvs,
    },
  });
});

const getUserPendingCVs = catchAsync(async (req, res, next) => {
  const cvs = await CV.find({ userId: req.user._id, status: "pending" });

  res.status(200).json({
    status: "success",
    results: cvs.length,
    data: {
      cvs,
    },
  });
});

export { createCV, getPendingCVs, getUserPendingCVs };
