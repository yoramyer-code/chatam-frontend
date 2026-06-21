// Group management
class GroupManager {
    generateAccessCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    isAccessCodeUnique(code, excludeGroupId = null) {
        const groups = storage.getGroups();
        return !groups.some(g => g.accessCode === code && g.id !== excludeGroupId);
    }

    createGroup(name, leader, accessCode = null, hasRemoteTeacher = false) {
        let code = accessCode;

        if (!code) {
            code = this.generateAccessCode();
            while (!this.isAccessCodeUnique(code)) {
                code = this.generateAccessCode();
            }
        } else if (!this.isAccessCodeUnique(code)) {
            return { success: false, error: 'קוד גישה זה כבר קיים' };
        }

        const group = {
            name,
            leader,
            accessCode: code,
            hasRemoteTeacher,
            createdAt: new Date().toISOString()
        };

        const savedGroup = storage.addGroup(group);
        return { success: true, group: savedGroup };
    }

    updateGroup(groupId, updates) {
        const group = storage.getGroupById(groupId);
        if (!group) {
            return { success: false, error: 'קבוצה לא נמצאה' };
        }

        // Validate access code if changed
        if (updates.accessCode && updates.accessCode !== group.accessCode) {
            if (!this.isAccessCodeUnique(updates.accessCode, groupId)) {
                return { success: false, error: 'קוד גישה זה כבר קיים' };
            }
        }

        const updated = storage.updateGroup(groupId, updates);
        return { success: true, group: updated };
    }

    deleteGroup(groupId) {
        storage.deleteGroup(groupId);
        return { success: true };
    }

    getGroupList() {
        return storage.getGroups();
    }

    getGroupById(groupId) {
        return storage.getGroupById(groupId);
    }

    getGroupByAccessCode(accessCode) {
        return storage.getGroupByAccessCode(accessCode);
    }

    getGroupsWithSubmissionStatus() {
        const groups = storage.getGroups();
        const preferences = storage.getPreferences();

        return groups.map(group => {
            const prefs = preferences.find(p => p.groupId === group.id);
            return {
                ...group,
                hasSubmitted: !!prefs,
                preferences: prefs || null
            };
        });
    }

    getSubmissionStats() {
        const groups = storage.getGroups();
        const submitted = storage.getPreferences().length;
        const remaining = groups.length - submitted;

        return {
            total: groups.length,
            submitted,
            remaining,
            percentComplete: groups.length > 0 ? Math.round((submitted / groups.length) * 100) : 0
        };
    }

    getMaxPointsForGroup(groupId) {
        const group = storage.getGroupById(groupId);
        return group?.hasRemoteTeacher ? 120 : 100;
    }
}

// Global group manager instance
const groupManager = new GroupManager();
