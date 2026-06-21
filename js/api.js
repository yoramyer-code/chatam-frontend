// API client for backend communication
class APIClient {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : 'https://chatam-backend.onrender.com/api';
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API Error');
            }

            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async initializeAdmins() {
        return this.request('/auth/init-admins', {
            method: 'POST'
        });
    }

    // Groups endpoints
    async getGroups() {
        return this.request('/groups');
    }

    async addGroup(name, leader, accessCode, hasRemoteTeacher) {
        return this.request('/groups', {
            method: 'POST',
            body: JSON.stringify({ name, leader, accessCode, hasRemoteTeacher })
        });
    }

    async updateGroup(id, name, leader, hasRemoteTeacher) {
        return this.request(`/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, leader, hasRemoteTeacher })
        });
    }

    async deleteGroup(id) {
        return this.request(`/groups/${id}`, {
            method: 'DELETE'
        });
    }

    async getGroupByAccessCode(accessCode) {
        return this.request(`/groups/access/${accessCode}`);
    }

    // Days endpoints
    async getDays() {
        return this.request('/days');
    }

    async addDay(date) {
        return this.request('/days', {
            method: 'POST',
            body: JSON.stringify({ date })
        });
    }

    async deleteDay(id) {
        return this.request(`/days/${id}`, {
            method: 'DELETE'
        });
    }

    // Preferences endpoints
    async getPreferences(groupId) {
        return this.request(`/preferences/${groupId}`);
    }

    async submitPreferences(groupId, preferences) {
        return this.request(`/preferences/${groupId}/submit`, {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    }

    async updatePreferences(groupId, preferences) {
        return this.request(`/preferences/${groupId}`, {
            method: 'PUT',
            body: JSON.stringify(preferences)
        });
    }

    async getAllPreferences() {
        return this.request('/preferences');
    }

    // Results endpoints
    async calculateSchedule() {
        return this.request('/results/calculate', {
            method: 'POST'
        });
    }

    async getResults() {
        return this.request('/results');
    }

    async clearResults() {
        return this.request('/results', {
            method: 'DELETE'
        });
    }
}

// Global API client instance
const api = new APIClient();
