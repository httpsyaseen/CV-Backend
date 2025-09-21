import { Schema, model } from "mongoose";
import pkg from "validator";
const { isEmail } = pkg;
import { hash, compare } from "bcrypt";
import { randomBytes, createHash } from "crypto";

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "Please provide a first name"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Please provide a last name"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "Please provide an Email"],
    validate: [isEmail, "Please provide a valid email"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide a phone number"],
    trim: true,
  },
  password: {
    type: String,
    minlength: [8, "Password must be more than or equal to 8 characters"],
    required: [true, "Please provide a password"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: true,
  },
  // Array of CV references created by this user
  cvs: [
    {
      type: Schema.Types.ObjectId,
      ref: "CV",
    },
  ],
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordExpiresAt: Date,
  passwordResetLink: String,
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.isPasswordCorrect = async function (candiatepass, userpass) {
  return await compare(candiatepass, userpass);
};

userSchema.methods.isPassChanged = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedTime > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.isPasswordChangedAfterTokenExpires = function (
  JWTTimeStamp
) {
  if (this.passwordChangedAt) {
    const passChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedTime > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.generateResetLink = function () {
  const resetLink = randomBytes(32).toString("hex");

  this.passwordResetLink = createHash("sha256").update(resetLink).digest("hex");

  this.passwordExpiresAt = Date.now() + 10 * 60 * 1000;
  return resetLink;
};

const User = model("User", userSchema);

export default User;
