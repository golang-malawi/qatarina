export default function useAuthHeaders() {
    const token = localStorage.getItem('auth.token') || 'none';
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
}