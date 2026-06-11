// Calls for the database-backed study features: shareable quizzes, attempt
// history, topic mastery, and the spaced-repetition review queue.
import getClientId from "../utils/clientId";

const BASE = process.env.REACT_APP_API_BASE_URL || "";

function headers(json = true) {
  const h = { "X-Client-Id": getClientId() };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function asJson(response) {
  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      msg = (await response.json()).error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return response.json();
}

// ---- Shareable quizzes ----
export async function saveSharedQuiz(quiz, difficulty, source = "text") {
  return asJson(
    await fetch(`${BASE}/api/quizzes`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ quiz, difficulty, source }),
    })
  );
}

export async function getSharedQuiz(id) {
  return asJson(await fetch(`${BASE}/api/quizzes/${id}`, { headers: headers(false) }));
}

// ---- Attempts / mastery ----
export async function saveAttempt(results, difficulty) {
  return asJson(
    await fetch(`${BASE}/api/attempts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ results, difficulty }),
    })
  );
}

export async function getAttempts() {
  return asJson(await fetch(`${BASE}/api/attempts`, { headers: headers(false) }));
}

export async function getMastery() {
  return asJson(await fetch(`${BASE}/api/mastery`, { headers: headers(false) }));
}

// ---- Spaced review ----
export async function getReviewDue() {
  return asJson(await fetch(`${BASE}/api/review/due`, { headers: headers(false) }));
}

export async function getReviewCounts() {
  return asJson(await fetch(`${BASE}/api/review/counts`, { headers: headers(false) }));
}

export async function gradeReview(id, correct) {
  return asJson(
    await fetch(`${BASE}/api/review/grade`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id, correct }),
    })
  );
}
