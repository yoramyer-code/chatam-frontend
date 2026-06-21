// Preferences management
class PreferencesManager {
    validatePreferences(groupId, preferences) {
        const group = storage.getGroupById(groupId);
        if (!group) {
            return { valid: false, error: 'קבוצה לא נמצאה' };
        }

        const startDate = storage.getSeriesStartDate();
        if (!startDate) {
            return { valid: false, error: 'לא הוגדר תאריך התחלה לסדרה' };
        }

        const days = storage.getWorkingDays(startDate);
        const maxPoints = groupManager.getMaxPointsForGroup(groupId);
        let total = 0;

        for (const day of days) {
            const dayKey = `day_${day.id}`;
            total += preferences[dayKey] || 0;
        }

        if (total !== maxPoints) {
            return {
                valid: false,
                error: `סכום הנקודות חייב להיות בדיוק ${maxPoints}. כרגע: ${total}`,
                total
            };
        }

        return { valid: true, total };
    }

    submitPreferences(groupId, preferences) {
        // Check if already submitted
        const existing = storage.getPreferencesByGroupId(groupId);
        if (existing && existing.submitted) {
            return { success: false, error: 'העדפות של קבוצה זו כבר הוזנו' };
        }

        // Validate
        const validation = this.validatePreferences(groupId, preferences);
        if (!validation.valid) {
            return { success: false, error: validation.error, total: validation.total };
        }

        // Save
        const result = storage.addPreferences(groupId, preferences);
        if (!result) {
            return { success: false, error: 'עדכון העדפות נכשל' };
        }

        return { success: true };
    }

    getGroupPreferences(groupId) {
        return storage.getPreferencesByGroupId(groupId);
    }

    hasGroupSubmitted(groupId) {
        const prefs = storage.getPreferencesByGroupId(groupId);
        return !!prefs && prefs.submitted;
    }

    updatePreferences(groupId, preferences) {
        const validation = this.validatePreferences(groupId, preferences);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const updated = storage.updatePreferences(groupId, preferences);
        return { success: true, preferences: updated };
    }

    deletePreferences(groupId) {
        storage.deletePreferences(groupId);
        return { success: true };
    }

    getAllPreferences() {
        return storage.getPreferences();
    }
}

// Global preferences manager instance
const preferencesManager = new PreferencesManager();
