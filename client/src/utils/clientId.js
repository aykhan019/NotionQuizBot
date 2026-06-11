// A stable anonymous id for this browser, so study history / review queue can be
// scoped without any login. Stored in localStorage; generated once.
const KEY = "quizbot_client_id";

export default function getClientId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
