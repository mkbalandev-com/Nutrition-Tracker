import { useEffect, useState } from "react";
import { getFoodHistory } from "../services/api";

function Nutrition() {
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const goals = {
    calories: 2500,
    protein: 75,
    carbs: 250,
    fats: 70,
  };

  useEffect(() => {
    let isMounted = true;

    async function loadNutrition() {
      try {
        setLoading(true);
        setError("");

        const result = await getFoodHistory();
        const records = Array.isArray(result.data) ? result.data : [];

        const totals = records.reduce(
          (total, record) => {
            const items = Array.isArray(record.items) ? record.items : [];

            items.forEach((item) => {
              total.calories += Number(item.calories) || 0;
              total.protein += Number(item.protein) || 0;
              total.carbs += Number(item.carbs) || 0;
              total.fats += Number(item.fat) || 0;
            });

            return total;
          },
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        if (isMounted) {
          setNutrition(totals);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load nutrition data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNutrition();

    return () => {
      isMounted = false;
    };
  }, []);

  const nutrients = [
    {
      name: "Protein",
      value: nutrition.protein,
      goal: goals.protein,
      unit: "g",
      color: "#e9a33d",
    },
    {
      name: "Carbohydrates",
      value: nutrition.carbs,
      goal: goals.carbs,
      unit: "g",
      color: "#548be7",
    },
    {
      name: "Fats",
      value: nutrition.fats,
      goal: goals.fats,
      unit: "g",
      color: "#9c78dd",
    },
  ];

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="welcome-text">DAILY HEALTH OVERVIEW</p>
          <h1>Nutrition Analysis</h1>
          <p className="dashboard-subtitle">
            Your nutrition totals from saved food analyses.
          </p>
        </div>

        <div className="date-badge">🥗 Nutrition Summary</div>
      </div>

      {loading ? (
        <section className="content-panel">
          <h2>Loading nutrition data...</h2>
        </section>
      ) : error ? (
        <section className="content-panel">
          <h2>Unable to load nutrition</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </section>
      ) : (
        <>
          <section className="nutrition-overview">
            <div className="nutrition-card">
              <div className="card-top">
                <span>Calories</span>
                <span className="card-icon">🔥</span>
              </div>
              <h2>
                {Math.round(nutrition.calories).toLocaleString()}{" "}
                <small>kcal</small>
              </h2>
              <p>
                Daily goal: {goals.calories.toLocaleString()} kcal
              </p>
            </div>

            <div className="nutrition-card">
              <div className="card-top">
                <span>Protein</span>
                <span className="card-icon">💪</span>
              </div>
              <h2>
                {nutrition.protein.toFixed(1)} <small>g</small>
              </h2>
              <p>Daily goal: {goals.protein} g</p>
            </div>
          </section>

          <section className="content-panel">
            <div className="section-heading">
              <div>
                <h2>Nutrient Breakdown</h2>
                <p>
                  Saved food totals compared with your configured goals.
                </p>
              </div>
            </div>

            <div className="nutrient-list">
              {nutrients.map((item) => {
                const percentage =
                  item.goal > 0
                    ? Math.min((item.value / item.goal) * 100, 100)
                    : 0;

                return (
                  <div className="nutrient-item" key={item.name}>
                    <div className="nutrient-info">
                      <strong>{item.name}</strong>
                      <span>
                        {item.value.toFixed(1)} / {item.goal} {item.unit}
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <p className="nutrient-percentage">
                      {Math.round(percentage)}% of goal
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="content-panel nutrition-tip">
            <span className="ai-icon">💡</span>
            <div>
              <h2>Nutrition Tip</h2>
              <p>
                Include a variety of vegetables, fruits, whole grains
                and protein-rich foods in your daily meals.
              </p>
            </div>
          </section>
        </>
      )}

      <p className="nutrition-disclaimer">
        Nutrition totals are calculated from saved food analyses.
        Daily goals are sample values and may not suit everyone.
      </p>
    </main>
  );
}

export default Nutrition;
