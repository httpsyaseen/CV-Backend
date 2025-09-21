import { Schema, model } from "mongoose";

// Schema for examples within sections
const exampleSchema = new Schema(
  {
    bad: {
      type: String,
      trim: true,
    },
    better: {
      type: String,
      trim: true,
    },
    why_better: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Schema for each section of the review
const sectionSchema = new Schema(
  {
    section_name: {
      type: String,
      trim: true,
    },
    section_status: {
      type: String,
      enum: ["ok", "missing", "needs_work", "excellent"],
      default: "ok",
    },
    strengths: [
      {
        type: String,
        trim: true,
      },
    ],
    weaknesses: [
      {
        type: String,
        trim: true,
      },
    ],
    actionable_edits: [
      {
        type: String,
        trim: true,
      },
    ],
    examples_bad_to_better: [exampleSchema],
    missing_content: [
      {
        type: String,
        trim: true,
      },
    ],
    section_score: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    justification: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Schema for scoring breakdown
const scoringBreakdownSchema = new Schema(
  {
    section_name: {
      type: String,
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  { _id: false }
);

// Schema for global summary
const globalSummarySchema = new Schema(
  {
    overall_readiness: {
      type: String,
      enum: ["Excellent", "Good", "Needs work", "Poor"],
      default: "Needs work",
    },
    top_fixes: [
      {
        type: String,
        trim: true,
      },
    ],
    questions_for_user: [
      {
        type: String,
        trim: true,
      },
    ],
    scoring_breakdown: [scoringBreakdownSchema],
    total_score: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

// Schema for rewritten CV sections
const rewrittenSectionSchema = new Schema(
  {
    section_name: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Schema for rewritten CV
const rewrittenCvSchema = new Schema(
  {
    sections: [rewrittenSectionSchema],
  },
  { _id: false }
);

// Schema for meta information
const metaSchema = new Schema(
  {
    version: {
      type: String,
      default: "v1",
    },
    notes: {
      type: String,
      trim: true,
    },
    reviewer_name: {
      type: String,
      trim: true,
    },
    review_date: {
      type: Date,
      default: Date.now,
    },
    time_investment_hours: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

// Main Review Schema
const reviewSchema = new Schema(
  {
    // References
    cvId: {
      type: Schema.Types.ObjectId,
      ref: "CV",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Review type
    review_type: {
      type: String,
      enum: ["standard", "premium"],
      default: "standard",
    },

    // Main review sections
    sections: [sectionSchema],

    // Global summary
    global_summary: globalSummarySchema,

    // Rewritten CV (for premium reviews)
    rewritten_cv: rewrittenCvSchema,

    // Meta information
    meta: metaSchema,

    // Review status
    status: {
      type: String,
      enum: ["draft", "completed", "delivered"],
      default: "draft",
    },

    // Additional fields for tracking
    reviewer_id: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming reviewers are also users with admin role
    },

    completed_at: {
      type: Date,
    },

    delivered_at: {
      type: Date,
    },

    // Custom feedback fields
    additional_notes: {
      type: String,
      trim: true,
    },

    // Rating from user (after delivery)
    user_rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    user_feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update completion/delivery dates
reviewSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completed_at) {
      this.completed_at = new Date();
    }
    if (this.status === "delivered" && !this.delivered_at) {
      this.delivered_at = new Date();
    }
  }
  next();
});

// Instance method to calculate overall score
reviewSchema.methods.calculateOverallScore = function () {
  if (this.sections && this.sections.length > 0) {
    const totalScore = this.sections.reduce(
      (sum, section) => sum + (section.section_score || 0),
      0
    );
    this.global_summary.total_score = totalScore;
    return totalScore;
  }
  return 0;
};

// Instance method to get review summary
reviewSchema.methods.getReviewSummary = function () {
  return {
    id: this._id,
    review_type: this.review_type,
    status: this.status,
    total_score: this.global_summary?.total_score || 0,
    overall_readiness: this.global_summary?.overall_readiness || "Needs work",
    completed_at: this.completed_at,
    delivered_at: this.delivered_at,
    user_rating: this.user_rating,
  };
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgScore: { $avg: "$global_summary.total_score" },
        avgRating: { $avg: "$user_rating" },
      },
    },
  ]);

  return stats;
};

// Virtual for days since creation
reviewSchema.virtual("daysSinceCreation").get(function () {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

// Virtual for turnaround time (creation to completion)
reviewSchema.virtual("turnaroundDays").get(function () {
  if (this.completed_at) {
    return Math.floor(
      (this.completed_at - this.createdAt) / (1000 * 60 * 60 * 24)
    );
  }
  return null;
});

// Ensure virtual fields are serialized
reviewSchema.set("toJSON", { virtuals: true });

const Review = model("Review", reviewSchema);

export default Review;
