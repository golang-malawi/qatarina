export default function createAuthHeaders() {
  // Try both keys for safety
  const rawUser = localStorage.getItem("auth.user");
  const token = localStorage.getItem("access_token");

  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      if (user.token) {
        return { Authorization: `Bearer ${user.token}` };
      }
    } catch {
      // ignore parse errors
    }
  }

  return {};
}
