
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Blob } = require("buffer");
const mongoose = require("mongoose");
require("dotenv").config();

const FoodAnalysis = require("./models/FoodAnalysis");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/nutrition_tracker";

const allowedMealCategories = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Dinner",
  "Uncategorized",
];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Authentication routes
app.use("/api/auth", authRoutes);

// Connect MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((error) =>
    console.error("MongoDB connection failed:", error.message)
  );

// Image upload settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Upload a JPG, PNG, WEBP, or GIF image.")
    );
  },
});

// Home route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "NutriAI Backend is running!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Backend connected successfully",
    aiConfigured: Boolean(process.env.FOODBASE_API_KEY),
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Upload and analyse food image
app.post(
  "/api/food/upload",
  authMiddleware,
  upload.single("foodImage"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message:
          "Please upload a valid JPG, PNG, WEBP, or GIF image.",
      });
    }

    if (!process.env.FOODBASE_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "FoodBase API key is not configured.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "error",
        message: "Database is not connected. Please try again.",
      });
    }

    try {
      const formData = new FormData();

      formData.append(
        "image",
        new Blob([req.file.buffer], {
          type: req.file.mimetype,
        }),
        req.file.originalname
      );

      const aiResponse = await fetch(
        "https://foodbase.dev/v1/vision/meal",
        {
          method: "POST",
          headers: {
            "X-API-Key": process.env.FOODBASE_API_KEY,
          },
          body: formData,
          signal: AbortSignal.timeout(30000),
        }
      );

      const responseText = await aiResponse.text();

      let aiData;

      try {
        aiData = JSON.parse(responseText);
      } catch {
        aiData = {
          message: "AI service returned an invalid response.",
        };
      }

      if (!aiResponse.ok) {
        console.error(
          "FoodBase API error:",
          aiResponse.status,
          aiData
        );

        return res.status(502).json({
          status: "error",
          message:
            aiData.message ||
            aiData.error ||
            `FoodBase AI request failed (${aiResponse.status}).`,
        });
      }

      const items = (
        Array.isArray(aiData.items) ? aiData.items : []
      ).map((item) => {
        const match = item.match || {};
        const nutrition = match.per_100g || {};
        const portion = Number(item.portion_g_est);

        const validPortion =
          Number.isFinite(portion) && portion >= 0
            ? portion
            : null;

        const estimatedCalories = Number(match.estimated_kcal);

        const calories =
          match.estimated_kcal !== null &&
          match.estimated_kcal !== undefined &&
          Number.isFinite(estimatedCalories)
            ? estimatedCalories
            : null;

        const calculateMacro = (value) => {
          const amount = Number(value);

          if (
            validPortion === null ||
            value === null ||
            value === undefined ||
            !Number.isFinite(amount)
          ) {
            return null;
          }

          return Number(
            ((amount * validPortion) / 100).toFixed(2)
          );
        };

        const confidence = Number(item.confidence);

        return {
          name:
            item.dish ||
            match.name_default ||
            "Unknown food",
          category: "Uncategorized",
          portionGrams: validPortion,
          calories,
          protein: calculateMacro(nutrition.proteins_g),
          carbs: calculateMacro(nutrition.carbs_g),
          fat: calculateMacro(nutrition.fat_g),
          confidence:
            item.confidence !== null &&
            item.confidence !== undefined &&
            Number.isFinite(confidence)
              ? confidence
              : null,
        };
      });

      const total = Number(aiData.estimated_total_kcal);

      const savedAnalysis = await FoodAnalysis.create({
        userId: req.userId,
        imageName: req.file.originalname,
        items,
        totalCalories:
          aiData.estimated_total_kcal !== null &&
          aiData.estimated_total_kcal !== undefined &&
          Number.isFinite(total)
            ? total
            : null,
        disclaimer:
          typeof aiData.disclaimer === "string"
            ? aiData.disclaimer
            : "",
        source: "FoodBase",
      });

      console.log(
        "Food analysis saved:",
        savedAnalysis._id.toString()
      );

      return res.json({
        status: "success",
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysisId: savedAnalysis._id,
        data: aiData,
      });
    } catch (error) {
      console.error("Food analysis error:", error.message);

      if (
        error.name === "TimeoutError" ||
        error.name === "AbortError"
      ) {
        return res.status(504).json({
          status: "error",
          message: "AI analysis timed out. Please try again.",
        });
      }

      return res.status(500).json({
        status: "error",
        message:
          "Food analysis or database saving failed. Please try again.",
      });
    }
  }
);

// Get only the authenticated user's food history
app.get(
  "/api/food/history",
  authMiddleware,
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          status: "error",
          message: "Database is not connected.",
        });
      }

      const filter = { userId: req.userId };

      if (req.query.date) {
        const date = req.query.date;
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(date)) {
          return res.status(400).json({
            status: "error",
            message: "Date must use YYYY-MM-DD format.",
          });
        }

        const [year, month, day] = date.split("-").map(Number);
        const start = new Date(
          Date.UTC(year, month - 1, day)
        );

        if (
          start.getUTCFullYear() !== year ||
          start.getUTCMonth() !== month - 1 ||
          start.getUTCDate() !== day
        ) {
          return res.status(400).json({
            status: "error",
            message: "Please provide a valid calendar date.",
          });
        }

        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);

        filter.createdAt = {
          $gte: start,
          $lt: end,
        };
      }

      const history = await FoodAnalysis.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.json({
        status: "success",
        count: history.length,
        data: history,
      });
    } catch (error) {
      console.error("History fetch error:", error.message);

      return res.status(500).json({
        status: "error",
        message: "Unable to retrieve food analysis history.",
      });
    }
  }
);

// Update a food item's category permanently
app.patch(
  "/api/food/history/:analysisId/items/:itemIndex/category",
  authMiddleware,
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          status: "error",
          message: "Database is not connected.",
        });
      }

      const { analysisId, itemIndex } = req.params;
      const { category } = req.body;
      const index = Number(itemIndex);

      if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid food analysis ID.",
        });
      }

      if (!Number.isInteger(index) || index < 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid food item index.",
        });
      }

      if (!allowedMealCategories.includes(category)) {
        return res.status(400).json({
          status: "error",
          message: "Please select a valid meal category.",
        });
      }

      // Prevent users from editing another user's food records.
      const analysis = await FoodAnalysis.findOne({
        _id: analysisId,
        userId: req.userId,
      });

      if (!analysis) {
        return res.status(404).json({
          status: "error",
          message: "Food record not found.",
        });
      }

      if (index >= analysis.items.length) {
        return res.status(404).json({
          status: "error",
          message: "Food item not found.",
        });
      }

      analysis.items[index].category = category;
      await analysis.save();

      return res.json({
        status: "success",
        message: "Meal category saved successfully.",
        analysisId: analysis._id,
        itemIndex: index,
        category: analysis.items[index].category,
      });
    } catch (error) {
      console.error("Category update error:", error.message);

      return res.status(500).json({
        status: "error",
        message: "Unable to save meal category.",
      });
    }
  }
);

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image size must be less than 5 MB."
        : "Please upload only one image at a time.";

    return res.status(400).json({
      status: "error",
      message,
    });
  }

  return res.status(400).json({
    status: "error",
    message: err.message || "Something went wrong.",
  });
});

app.listen(PORT, () => {
  console.log(
    `NutriAI server running at http://localhost:${PORT}`
  );
});
