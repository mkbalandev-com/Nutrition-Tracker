
const API_URL = "http://localhost:5000";

function getAuthHeaders() {
  const token = sessionStorage.getItem("nutriai_token");

  if (!token) {
    throw new Error("Please login to continue.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (response.status === 401) {
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        `Request failed with status ${response.status}`
    );
  }

  return result;
}

export async function checkBackend() {
  const response = await fetch(`${API_URL}/api/health`);
  return parseResponse(response);
}

export async function uploadFoodImage(file) {
  if (!file) {
    throw new Error("Please select a food image.");
  }

  const formData = new FormData();
  formData.append("foodImage", file);

  const response = await fetch(`${API_URL}/api/food/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  return parseResponse(response);
}

export async function getFoodHistory(date) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : "";

  const response = await fetch(
    `${API_URL}/api/food/history${query}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(response);
}

// Save a meal category permanently in MongoDB
export async function updateFoodCategory(
  analysisId,
  itemIndex,
  category
) {
  const response = await fetch(
    `${API_URL}/api/food/history/${encodeURIComponent(
      analysisId
    )}/items/${itemIndex}/category`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    }
  );

  return parseResponse(response);
}
