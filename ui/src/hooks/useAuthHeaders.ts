export default function createAuthHeaders() {
  const raw = localStorage.getItem("auth.user");
  if (!raw) return {};

  try {
    const user = JSON.parse(raw);
    if (user.token) {
      return {
        Authorization: `Bearer ${user.token}`,
      };
    }
  } catch {}

  return {};
}