import { Schema, model } from "mongoose";

// Helper function to count words in a text
const wordCount = (text) => {
  return text
    ? text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;
};

// Custom validator for word count
const wordCountValidator = (maxWords) => {
  return function (value) {
    if (!value) return true; // Allow empty values
    const words = wordCount(value);
    return words <= maxWords;
  };
};

// Custom validator for minimum words (5 words minimum)
const minWordValidator = function (value) {
  if (!value || value.trim() === "") return true; // Allow empty values
  const words = wordCount(value);
  return words >= 5;
};

// Schema for previous employment/experience
const previousExperienceSchema = new Schema({
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function (value) {
        return value >= this.startDate;
      },
      message: "End date must be after start date",
    },
  },
  hospitalName: {
    type: String,
    required: [true, "Hospital name is required"],
    maxlength: [100, "Hospital name cannot exceed 100 characters"],
    trim: true,
  },
  hospitalAddress: {
    type: String,
    required: [true, "Hospital address is required"],
    maxlength: [100, "Hospital address cannot exceed 100 characters"],
    trim: true,
  },
  jobTitle: {
    type: String,
    required: [true, "Job title is required"],
    maxlength: [20, "Job title cannot exceed 20 characters"],
    trim: true,
  },
  jobDescription: {
    type: String,
    required: [true, "Job description is required"],
    validate: [
      {
        validator: wordCountValidator(750),
        message: "Job description cannot exceed 750 words",
      },
      {
        validator: minWordValidator,
        message: "Job description must contain at least 5 words",
      },
    ],
    trim: true,
  },
});

// Main CV Schema
const cvSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Page 1 - Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      maxlength: [60, "First name cannot exceed 60 characters"],
      match: [
        /^[A-Za-z]+$/,
        "First name must contain only alphabetic characters",
      ],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      maxlength: [15, "Last name cannot exceed 15 characters"],
      match: [
        /^[A-Za-z]+$/,
        "Last name must contain only alphabetic characters",
      ],
      trim: true,
    },
    yearOfBirth: {
      type: Number,
      required: [true, "Year of birth is required"],
      min: [1900, "Year of birth cannot be before 1900"],
      max: [new Date().getFullYear(), "Year of birth cannot be in the future"],
    },
    yearOfMedicalGraduation: {
      type: Number,
      required: [true, "Year of medical graduation is required"],
      min: [1900, "Year of medical graduation cannot be before 1900"],
      max: [
        new Date().getFullYear(),
        "Year of medical graduation cannot be in the future",
      ],
    },
    applyingForJobRole: {
      type: String,
      required: [true, "Job role selection is required"],
      enum: {
        values: ["tier1", "middleGrade", "consultant"],
        message: "Job role must be one of: Tier 1, Middle Grade, or Consultant",
      },
    },
    targetMarkets: {
      type: [String],
      required: [true, "At least one target market must be selected"],
      enum: {
        values: [
          "uk",
          "republicOfIreland",
          "europe",
          "america",
          "gcc",
          "others",
        ],
        message: "Invalid target market selection",
      },
      validate: {
        validator: function (array) {
          return array && array.length > 0;
        },
        message: "At least one target market must be selected",
      },
    },

    // Page 2 - Previous Experience and Employment
    previousExperiences: {
      type: [previousExperienceSchema],
      validate: {
        validator: function (array) {
          return array.length <= 10;
        },
        message:
          "Maximum allowed is 10 previous jobs. Please combine successive jobs together if you have more than 10.",
      },
      default: [],
    },

    // Page 3 - Academic & Professional Experience
    researchExperience: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(1000),
          message: "Research experience cannot exceed 1000 words",
        },
        {
          validator: minWordValidator,
          message:
            "Research experience must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },
    teachingExperience: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(1000),
          message: "Teaching experience cannot exceed 1000 words",
        },
        {
          validator: minWordValidator,
          message:
            "Teaching experience must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },
    leadershipManagementExperience: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(1000),
          message:
            "Leadership & management experience cannot exceed 1000 words",
        },
        {
          validator: minWordValidator,
          message:
            "Leadership & management experience must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },
    auditQualityImprovementExperience: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(1000),
          message:
            "Audit & quality improvement experience cannot exceed 1000 words",
        },
        {
          validator: minWordValidator,
          message:
            "Audit & quality improvement experience must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },
    clinicalSkillsProcedureCompetency: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(1000),
          message:
            "Clinical skills & procedure competency cannot exceed 1000 words",
        },
        {
          validator: minWordValidator,
          message:
            "Clinical skills & procedure competency must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },

    // Page 4 - Personal Statement
    personalStatement: {
      type: String,
      validate: [
        {
          validator: wordCountValidator(2500),
          message: "Personal statement cannot exceed 2500 words",
        },
        {
          validator: minWordValidator,
          message:
            "Personal statement must contain at least 5 words if provided",
        },
      ],
      trim: true,
      default: "",
    },

    // Page 5 - Service Level Selection
    serviceLevel: {
      type: String,
      required: [true, "Service level selection is required"],
      enum: {
        values: ["standard", "premium"],
        message:
          "Service level must be either Standard Review or Premium Review",
      },
    },

    // Metadata
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to set submitted date when status changes to submitted
cvSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "submitted" &&
    !this.submittedAt
  ) {
    this.submittedAt = new Date();
  }
  if (
    this.isModified("status") &&
    this.status === "reviewed" &&
    !this.reviewedAt
  ) {
    this.reviewedAt = new Date();
  }
  next();
});

// Instance method to get word count for any field
cvSchema.methods.getWordCount = function (fieldName) {
  const fieldValue = this[fieldName];
  return wordCount(fieldValue);
};

// Instance method to get remaining words for any field
cvSchema.methods.getRemainingWords = function (fieldName, maxWords) {
  const currentWords = this.getWordCount(fieldName);
  return Math.max(0, maxWords - currentWords);
};

// Static method to get field word limits
cvSchema.statics.getWordLimits = function () {
  return {
    jobDescription: 750,
    researchExperience: 1000,
    teachingExperience: 1000,
    leadershipManagementExperience: 1000,
    auditQualityImprovementExperience: 1000,
    clinicalSkillsProcedureCompetency: 1000,
    personalStatement: 2500,
  };
};

// Virtual for full name
cvSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
cvSchema.set("toJSON", { virtuals: true });

const CV = model("CV", cvSchema);

export default CV;
