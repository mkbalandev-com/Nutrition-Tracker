
const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    portionGrams: {
      type: Number,
      default: null,
    },
    calories: {
      type: Number,
      default: null,
    },
    protein: {
      type: Number,
      default: null,
    },
    carbs: {
      type: Number,
      default: null,
    },
    fat: {
      type: Number,
      default: null,
    },
    confidence: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const foodAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageName: {
      type: String,
      required: true,
    },
    items: {
      type: [foodItemSchema],
      default: [],
    },
    totalCalories: {
      type: Number,
      default: null,
    },
    disclaimer: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "FoodBase",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FoodAnalysis", foodAnalysisSchema);
