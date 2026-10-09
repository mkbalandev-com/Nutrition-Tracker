
import { useRef, useState, useEffect } from "react";
import { uploadFoodImage } from "../services/api";

function FoodTracker() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleImage = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setUploadStatus("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadStatus("Image size must be less than 5 MB.");
      return;
    }

    setFile(selectedFile);
    setImage(URL.createObjectURL(selectedFile));
    setUploadStatus("");
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setUploadStatus("Please upload a food image first.");
      return;
    }

    try {
      setUploading(true);
      setUploadStatus("Analyzing food image with AI...");
      setResult(null);

      const response = await uploadFoodImage(file);

      if (!response || response.status !== "success" || !response.data) {
        throw new Error("AI response was not received from backend.");
      }

      setResult(response);
      setUploadStatus("AI analysis completed!");
    } catch (error) {
      setUploadStatus(`Analysis failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const aiData = result?.data;

  const items = Array.isArray(aiData?.items)
    ? aiData.items
    : [];

  const totalCalories = aiData?.estimated_total_kcal;

  const getNutrient = (item, nutrient) => {
    const value = item?.match?.per_100g?.[nutrient];

    return typeof value === "number"
      ? `${value} g / 100 g`
      : "N/A";
  };

  return (
    <main className="dashboard food-tracker-page">
      <div className="dashboard-header">
        <div>
          <p className="welcome-text">AI NUTRITION ANALYSIS</p>
          <h1>Food Image Tracker</h1>
          <p className="dashboard-subtitle">
            Upload your meal photo to analyze its nutrition.
          </p>
        </div>
      </div>

      <section className="content-panel food-upload-panel">
        <div className="section-heading">
          <div>
            <h2>Upload Your Food</h2>
            <p>Select a clear photo of your meal.</p>
          </div>
          <span className="card-icon">📸</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            handleImage(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {!image ? (
          <button
            type="button"
            className="food-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="upload-icon">📷</span>
            <strong>Upload Food Image</strong>
            <span>Choose from gallery or camera</span>
            <span className="upload-button-text">Choose Image</span>
          </button>
        ) : (
          <div className="food-image-preview">
            <img src={image} alt="Selected food" />
            <button
              type="button"
              className="change-image-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Image
            </button>
          </div>
        )}

        {file && (
          <p className="selected-file-name">
            Selected: {file.name}
          </p>
        )}

        <button
          type="button"
          className="analyze-food-button"
          onClick={handleAnalyze}
          disabled={!file || uploading}
        >
          {uploading ? "Analyzing..." : "✨ Upload & Analyze"}
        </button>

        {uploadStatus && (
          <p
            role="status"
            aria-live="polite"
            className="selected-file-name"
          >
            {uploadStatus}
          </p>
        )}
      </section>

      <section className="content-panel nutrition-placeholder">
        <div className="section-heading">
          <div>
            <h2>Nutrition Results</h2>
            <p>Results returned by the AI service</p>
          </div>
          <span className="card-icon">🥗</span>
        </div>

        {!result ? (
          <div className="nutrition-empty-state">
            <span>🍽️</span>
            <h3>Ready to analyze your meal?</h3>
            <p>Upload a food image to view the analysis.</p>
          </div>
        ) : (
          <div className="nutrition-empty-state">
            <span>✅</span>
            <h3>Food Analysis Results</h3>

            <p>File: {result.fileName}</p>

            <h2>
              {typeof totalCalories === "number"
                ? `${totalCalories} kcal`
                : "Total calories: N/A"}
            </h2>

            {items.length > 0 ? (
              items.map((item, index) => (
                <div
                  key={`${item.dish || "food"}-${index}`}
                  className="content-panel"
                  style={{ marginTop: "16px", textAlign: "left" }}
                >
                  <h3>
                    {item.dish || item.match?.name_default || "Detected food"}
                  </h3>

                  <p>
                    Estimated portion:{" "}
                    {typeof item.portion_g_est === "number"
                      ? `${item.portion_g_est} g`
                      : "N/A"}
                  </p>

                  <p>
                    Item calories:{" "}
                    {typeof item.match?.estimated_kcal === "number"
                      ? `${item.match.estimated_kcal} kcal`
                      : "N/A"}
                  </p>

                  <p>
                    Protein: {getNutrient(item, "proteins_g")}
                  </p>

                  <p>
                    Carbs: {getNutrient(item, "carbs_g")}
                  </p>

                  <p>
                    Fat: {getNutrient(item, "fat_g")}
                  </p>

                  <p>
                    AI confidence:{" "}
                    {typeof item.confidence === "number"
                      ? `${Math.round(item.confidence * 100)}%`
                      : "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p>
                The AI response did not contain food items in the
                expected format. Check the backend response format.
              </p>
            )}

            {aiData?.disclaimer && (
              <p style={{ marginTop: "16px" }}>
                Note: {aiData.disclaimer}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default FoodTracker;
