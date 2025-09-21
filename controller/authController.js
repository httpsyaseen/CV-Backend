import User from "../models/user.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { createHash } from "crypto";
import { promisify } from "util";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

const signUp = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  // Check if all required fields are provided
  if (!firstName || !lastName || !email || !password || !phoneNumber) {
    return next(
      new AppError(
        "Please provide all required fields: firstName, lastName, email, password, phoneNumber",
        400
      )
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User with this email already exists", 400));
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
  });

  // Generate token
  const token = signToken(user._id);

  // Send response without password
  const responseUser = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    roles: user.roles,
  };

  res.status(201).json({
    status: "success",
    data: {
      user: responseUser,
      token,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  // If everything ok, send token to client
  const token = signToken(user._id);
  const responseUser = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
  };

  res.status(200).json({
    status: "success",
    data: {
      user: responseUser,
      token,
    },
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("No user found with this email address", 404));
  }

  // Generate reset token
  const resetToken = user.generateResetLink();
  await user.save({ validateBeforeSave: false });
  console.log("Reset Token: ", resetToken);

  res.status(200).json({
    status: "success",
    message: "Password reset token generated successfully",
    data: {
      resetToken: resetToken,
      expiresIn: "10 minutes",
      message: "Use this token with the reset-password endpoint",
    },
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  // Check if password is provided
  if (!req.body.password) {
    return next(new AppError("Please provide a new password", 400));
  }

  // Get user based on token
  const hashtoken = createHash("sha256").update(req.params.token).digest("hex");

  console.log("Hashed Token: ", hashtoken);

  let user = await User.findOne({
    passwordResetLink: hashtoken,
    passwordExpiresAt: { $gt: Date.now() },
  });

  // If token expired or user doesn't exist
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Update password and clear reset fields
  user.password = req.body.password;
  user.passwordResetLink = undefined;
  user.passwordExpiresAt = undefined;
  await user.save();

  // Generate new token for immediate login
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password reset successful",
    data: {
      token,
      message: "You can now use your new password to login",
    },
  });
});
// Middleware to protect routes
const protect = catchAsync(async (req, res, next) => {
  // Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // Check if user changed password after the token was issued
  if (currentUser.isPassChanged(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

const changePassword = catchAsync(async (req, res, next) => {
  // Get current password and new password from request body
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError("Please provide both current password and new password", 400)
    );
  }

  // Get user from database with password
  const user = await User.findById(req.user.id).select("+password");

  // Check if current password is correct
  if (!(await user.isPasswordCorrect(currentPassword, user.password))) {
    return next(new AppError("Current password is incorrect", 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
    data: {
      token,
    },
  });
});

const verifyUser = catchAsync(async (req, res, next) => {
  //1. Get token and check if it exists
  let token;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Authorized Users Only", 401));
  }

  //2.Verify token and handle 2 Errors
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  //3. Check if user exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("User does not exist", 401));
  }
  //4. is Pasword Changed After the jwt issues
  const changed = currentUser.isPasswordChangedAfterTokenExpires(decoded.iat);
  if (changed) {
    return next(new AppError("User recently changed password", 401));
  }

  res.status(200).json({
    status: "success",
    user: currentUser,
  });
});

export function restrictedTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("The user does not have permission to do this action", 403)
      );

    next();
  };
}

export {
  signUp,
  login,
  resetPassword,
  forgotPassword,
  changePassword,
  protect,
  verifyUser,
};
