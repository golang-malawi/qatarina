export default function isLoggedIn(): boolean {
    return localStorage.getItem('auth.token') ? true : false;
}