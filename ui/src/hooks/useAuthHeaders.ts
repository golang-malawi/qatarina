export default function createAuthHeaders() {
    const token = localStorage.getItem('auth.token') || 'none';
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
}