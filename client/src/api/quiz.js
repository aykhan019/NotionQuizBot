// Single place that knows how to talk to the backend.
// In dev, BASE is empty and CRA proxies /api -> http://localhost:5000.
// In prod, set REACT_APP_API_BASE_URL to the deployed backend URL.
const BASE = process.env.REACT_APP_API_BASE_URL || "";

async function parseError(response) {
  try {
    const body = await response.json();
    return body.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

// Generate from pasted text or from Notion page IDs.
export async function generateQuiz({
  source,
  content,
  notionPageIds,
  numberOfQuestions,
  difficulty,
}) {
  const response = await fetch(`${BASE}/api/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      content,
      notion_page_ids: notionPageIds,
      number_of_questions: numberOfQuestions,
      difficulty,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

// Generate from an uploaded PDF file.
export async function generateQuizFromPdf({
  file,
  numberOfQuestions,
  difficulty,
}) {
  const form = new FormData();
  form.append("file", file);
  form.append("number_of_questions", numberOfQuestions);
  form.append("difficulty", difficulty);

  const response = await fetch(`${BASE}/api/quiz/generate-pdf`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}
