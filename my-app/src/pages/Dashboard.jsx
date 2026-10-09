import { useEffect, useState } from "react";
import { getFoodHistory } from "../services/api";

function Dashboard() {
  const [records, setRecords] = useState([]);
  const [view, setView] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Use local date instead of UTC date
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const result =
          view === "today"
            ? await getFoodHistory(today)
            : await getFoodHistory();

        if (!cancelled) {
          setRecords(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard data.");
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [view, today, refreshKey]);

  const foodItems = records.flatMap((record) =>
    (Array.isArray(record.items) ? record.items : []).map(
      (item, index) => ({
        id: `${record._id}-${index}`,
        name: item.name || "Unknown food",
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        createdAt: record.createdAt,
      })
    )
  );

  const totalCalories = records.reduce(
    (sum, record) => sum + (Number(record.totalCalories) || 0),
    0
  );

  const totalProtein = foodItems.reduce(
    (sum, item) => sum + item.protein,
    0
  );

  const totalCarbs = foodItems.reduce(
    (sum, item) => sum + item.carbs,
    0
  );

  const totalFat = foodItems.reduce(
    (sum, item) => sum + item.fat,
    0
  );

  const goals = {
    calories: 2500,
    protein: 75,
    carbs: 250,
    fat: 70,
  };

  const progress = (value, goal) =>
    Math.min(100, Math.round((value / goal) * 100));

  const recentItems = [...foodItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  const stats = [
    {
      title: "Calories Consumed",
      value: Math.round(totalCalories),
      unit: "kcal",
      goal: goals.calories,
      icon: "🔥",
      fill: "",
    },
    {
      title: "Protein",
      value: Number(totalProtein.toFixed(1)),
      unit: "g",
      goal: goals.protein,
      icon: "💪",
      fill: "protein-fill",
    },
    {
      title: "Carbohydrates",
      value: Number(totalCarbs.toFixed(1)),
      unit: "g",
      goal: goals.carbs,
      icon: "🌾",
      fill: "carbs-fill",
    },
    {
      title: "Fats",
      value: Number(totalFat.toFixed(1)),
      unit: "g",
      goal: goals.fat,
      icon: "🥑",
      fill: "fats-fill",
    },
  ];

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="welcome-text">WELCOME BACK!</p>
          <h1>Your Nutrition Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your food. Understand your nutrition. Eat better.
          </p>
        </div>

        <div className="date-badge">
          📅 {view === "today" ? "Today" : "All Records"}
        </div>
      </div>

      <div className="history-filters">
        <button
          type="button"
          className={`history-filter ${
            view === "today" ? "active-filter" : ""
          }`}
          onClick={() => setView("today")}
        >
          Today
        </button>

        <button
          type="button"
          className={`history-filter ${
            view === "all" ? "active-filter" : ""
          }`}
          onClick={() => setView("all")}
        >
          All Records
        </button>
      </div>

      {error && (
        <div className="content-panel">
          <p>⚠️ {error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}

      <section className="nutrition-overview">
        {stats.map((stat) => (
          <div className="nutrition-card" key={stat.title}>
            <div className="card-top">
              <span>{stat.title}</span>
              <span className="card-icon">{stat.icon}</span>
            </div>

            <h2>
              {loading ? "..." : stat.value.toLocaleString()}{" "}
              <small>{stat.unit}</small>
            </h2>

            <div className="progress-track">
              <div
                className={`progress-fill ${stat.fill}`}
                style={{
                  width: `${progress(stat.value, stat.goal)}%`,
                }}
              />
            </div>

            <p>
              Goal: {stat.goal} {stat.unit}
            </p>
          </div>
        ))}
      </section>

      <section className="dashboard-content">
        <div className="content-panel meals-panel">
          <div className="section-heading">
            <div>
              <h2>Recent Food Analysis</h2>
              <p>
                {view === "today"
                  ? "Today's saved food items"
                  : "All saved food items"}
              </p>
            </div>

            <span className="meal-count">
              {loading ? "Loading..." : `${foodItems.length} Items`}
            </span>
          </div>

          <div className="meal-list">
            {loading ? (
              <p>Loading food records...</p>
            ) : recentItems.length > 0 ? (
              recentItems.map((item) => (
                <div className="meal-item" key={item.id}>
                  <span className="meal-icon">🍽️</span>

                  <span className="meal-info">
                    <strong>{item.name}</strong>
                    <small>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Saved food"}
                    </small>
                  </span>

                  <span className="meal-calories">
                    {Math.round(item.calories)} kcal
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-food">
                <span>🍽️</span>
                <h3>No food records found</h3>
                <p>Upload a food image to see your analysis here.</p>
              </div>
            )}
          </div>

          <div className="meal-total">
            <span>
              {view === "today"
                ? "Today's estimated calories"
                : "All records' estimated calories"}
            </span>
            <strong>{Math.round(totalCalories)} kcal</strong>
          </div>
        </div>

        <div className="content-panel ai-panel">
          <div className="ai-heading">
            <span className="ai-icon">✨</span>
            <div>
              <h2>Nutrition Summary</h2>
              <p>
                {view === "today" ? "Today's data" : "All saved data"}
              </p>
            </div>
          </div>

          <div className="ai-message">
            <span>🍽️</span>
            <div>
              <strong>Food Items Analysed</strong>
              <p>
                {loading
                  ? "Calculating..."
                  : `${foodItems.length} food items.`}
              </p>
            </div>
          </div>

          <div className="ai-message">
            <span>💪</span>
            <div>
              <strong>Protein</strong>
              <p>{totalProtein.toFixed(1)} g estimated protein.</p>
            </div>
          </div>

          <div className="ai-message">
            <span>🥗</span>
            <div>
              <strong>Carbs and Fat</strong>
              <p>
                Carbs: {totalCarbs.toFixed(1)} g · Fat:{" "}
                {totalFat.toFixed(1)} g
              </p>
            </div>
          </div>

          <p className="ai-note">
            Nutrition values are AI estimates. Daily totals depend on
            the date range selected.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
