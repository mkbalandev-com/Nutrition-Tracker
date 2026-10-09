
import "./MealHistory.css";
import { useEffect, useState } from "react";
import { getFoodHistory } from "../services/api";

function MealHistory() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setLoading(true);
        setError("");

        const result = await getFoodHistory();

        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.data)
          ? result.data.data
          : [];

        const formattedMeals = records.flatMap((record) =>
          (Array.isArray(record.items) ? record.items : []).map(
            (item, index) => ({
              id: `${record._id}-${index}`,
              name: item.name || "Unknown food",
              time: record.createdAt
                ? new Date(record.createdAt).toLocaleString()
                : "Date unavailable",
              calories:
                item.calories != null &&
                Number.isFinite(Number(item.calories))
                  ? Number(item.calories)
                  : 0,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              imageName: record.imageName || "",
              icon: "🍽️",
            })
          )
        );

        if (isMounted) {
          setMeals(formattedMeals);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Unable to load food history."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCalories = meals.reduce(
    (total, meal) => total + meal.calories,
    0
  );

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="welcome-text">YOUR FOOD JOURNAL</p>
          <h1>Meal History</h1>
          <p className="dashboard-subtitle">
            Review your saved food analysis and calorie intake.
          </p>
        </div>

        <div className="date-badge">📅 All Records</div>
      </div>

      <section className="nutrition-overview">
        <div className="nutrition-card">
          <div className="card-top">
            <span>Total Food Items</span>
            <span className="card-icon">🍽️</span>
          </div>

          <h2>{meals.length}</h2>
          <p>All saved food items</p>
        </div>

        <div className="nutrition-card">
          <div className="card-top">
            <span>Total Calories</span>
            <span className="card-icon">🔥</span>
          </div>

          <h2>
            {Math.round(totalCalories)} <small>kcal</small>
          </h2>

          <p>Estimated calories across all records</p>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <h2>Food Records</h2>
            <p>All food items retrieved from your database.</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-food">
            <span>⏳</span>
            <h3>Loading food history...</h3>
            <p>Fetching saved records from your database.</p>
          </div>
        ) : error ? (
          <div className="empty-food">
            <span>⚠️</span>
            <h3>Unable to load history</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="history-list">
            {meals.length > 0 ? (
              meals.map((meal) => (
                <div className="history-item" key={meal.id}>
                  <div className="history-food-icon">
                    {meal.icon}
                  </div>

                  <div className="history-food-info">
                    <strong>{meal.name}</strong>

                    <span>
                      {meal.imageName || "Food image analysis"}
                    </span>

                    <span>
                      Protein: {meal.protein ?? "N/A"} g · Carbs:{" "}
                      {meal.carbs ?? "N/A"} g · Fat:{" "}
                      {meal.fat ?? "N/A"} g
                    </span>
                  </div>

                  <div className="history-food-time">
                    {meal.time}
                  </div>

                  <div className="history-food-calories">
                    {meal.calories} kcal
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-food">
                <span>🍽️</span>
                <h3>No food records found</h3>
                <p>
                  Analyze some food to see your records here.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="meal-total">
          <span>Total calories shown</span>
          <strong>{Math.round(totalCalories)} kcal</strong>
        </div>
      </section>

      <p className="nutrition-disclaimer">
        Nutrition values are AI estimates and may not reflect exact
        portions or actual nutritional content.
      </p>
    </main>
  );
}

export default MealHistory;