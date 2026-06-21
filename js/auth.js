// Authentication management
class Auth {
    constructor() {
        this.SESSION_KEY = 'chatam_session';
    }

    async login(username, password) {
        try {
            const result = await api.login(username, password);

            if (result.success) {
                // Store token
                api.setToken(result.token);

                // Store session
                const session = {
                    username: result.username,
                    loginTime: new Date().toISOString()
                };
                sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message || 'שגיאת התחברות' };
        }
    }

    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        api.clearToken();
    }

    isLoggedIn() {
        return sessionStorage.getItem(this.SESSION_KEY) !== null && api.token !== null;
    }

    getCurrentSession() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    getCurrentAdminUsername() {
        const session = this.getCurrentSession();
        return session?.username || null;
    }

    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    }
}

// Global auth instance
const auth = new Auth();
