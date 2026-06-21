// Storage management for the application
class Storage {
    constructor() {
        this.STORAGE_KEY = 'chatam_system';
        this.initializeIfNeeded();
    }

    initializeIfNeeded() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.initialize();
        }
    }

    initialize() {
        const initialData = {
            groups: [],
            preferences: [],
            results: null,
            seriesStartDate: null,
            admins: [
                { id: '1', username: 'admin1', password: 'password1' },
                { id: '2', username: 'admin2', password: 'password2' },
                { id: '3', username: 'admin3', password: 'password3' }
            ]
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
    }

    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // Groups operations
    getGroups() {
        const data = this.getData();
        return data?.groups || [];
    }

    saveGroups(groups) {
        const data = this.getData();
        data.groups = groups;
        this.saveData(data);
    }

    addGroup(group) {
        const groups = this.getGroups();
        group.id = String(Date.now());
        groups.push(group);
        this.saveGroups(groups);
        return group;
    }

    updateGroup(groupId, updates) {
        const groups = this.getGroups();
        const index = groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            groups[index] = { ...groups[index], ...updates };
            this.saveGroups(groups);
            return groups[index];
        }
        return null;
    }

    deleteGroup(groupId) {
        const groups = this.getGroups();
        const filtered = groups.filter(g => g.id !== groupId);
        this.saveGroups(filtered);
        // Also delete associated preferences
        this.deletePreferences(groupId);
    }

    getGroupByAccessCode(accessCode) {
        const groups = this.getGroups();
        return groups.find(g => g.accessCode === accessCode);
    }

    getGroupById(groupId) {
        const groups = this.getGroups();
        return groups.find(g => g.id === groupId);
    }

    // Preferences operations
    getPreferences() {
        const data = this.getData();
        return data?.preferences || [];
    }

    savePreferences(preferences) {
        const data = this.getData();
        data.preferences = preferences;
        this.saveData(data);
    }

    addPreferences(groupId, prefs) {
        const preferences = this.getPreferences();
        const existing = preferences.find(p => p.groupId === groupId);
        if (!existing) {
            preferences.push({
                groupId: groupId,
                ...prefs,
                submitted: true,
                submittedAt: new Date().toISOString()
            });
            this.savePreferences(preferences);
            return true;
        }
        return false;
    }

    updatePreferences(groupId, prefs) {
        const preferences = this.getPreferences();
        const index = preferences.findIndex(p => p.groupId === groupId);
        if (index !== -1) {
            preferences[index] = { ...preferences[index], ...prefs };
            this.savePreferences(preferences);
            return preferences[index];
        }
        return null;
    }

    getPreferencesByGroupId(groupId) {
        const preferences = this.getPreferences();
        return preferences.find(p => p.groupId === groupId);
    }

    deletePreferences(groupId) {
        const preferences = this.getPreferences();
        const filtered = preferences.filter(p => p.groupId !== groupId);
        this.savePreferences(filtered);
    }

    // Results operations
    getResults() {
        const data = this.getData();
        return data?.results || null;
    }

    saveResults(results) {
        const data = this.getData();
        data.results = results;
        this.saveData(data);
    }

    clearResults() {
        const data = this.getData();
        data.results = null;
        this.saveData(data);
    }

    // Admin operations
    getAdmins() {
        const data = this.getData();
        return data?.admins || [];
    }

    getAdminByUsername(username) {
        const admins = this.getAdmins();
        return admins.find(a => a.username === username);
    }

    // Series start date operations
    getSeriesStartDate() {
        const data = this.getData();
        return data?.seriesStartDate || null;
    }

    setSeriesStartDate(date) {
        const data = this.getData();
        data.seriesStartDate = date;
        this.saveData(data);
    }

    clearSeriesStartDate() {
        const data = this.getData();
        data.seriesStartDate = null;
        this.saveData(data);
    }

    // Calculate 5 working days (Sun-Thu) starting from a given date
    getWorkingDays(startDate) {
        const days = [];

        // Parse date safely to avoid timezone issues
        // startDate format: YYYY-MM-DD
        const [year, month, day] = startDate.split('-').map(Number);
        let currentDate = new Date(year, month - 1, day);

        // If start date is Thursday, Friday or Saturday, move to next Sunday
        let dayOfWeek = currentDate.getDay();
        if (dayOfWeek >= 4) {
            // Move to next Sunday (4=Thu, 5=Fri, 6=Sat)
            currentDate.setDate(currentDate.getDate() + (7 - dayOfWeek));
        }

        // Get 5 working days (Sun-Thu)
        while (days.length < 5) {
            dayOfWeek = currentDate.getDay();
            // 0-4 = Sun-Thu (working days), 5-6 = Fri-Sat (skip)
            if (dayOfWeek <= 4) {
                // Format date back to YYYY-MM-DD
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');

                days.push({
                    id: String(days.length),
                    date: `${y}-${m}-${d}`,
                    dayOfWeek: dayOfWeek
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    }

    // General operations
    resetAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.initialize();
    }

    exportData() {
        return this.getData();
    }

    importData(data) {
        this.saveData(data);
    }
}

// Global storage instance
const storage = new Storage();
