// Schedule calculation engine
class Calculator {
    calculateSchedule() {
        const groups = storage.getGroups();
        const preferences = storage.getPreferences();
        const startDate = storage.getSeriesStartDate();

        // Validate series start date is defined
        if (!startDate) {
            return {
                success: false,
                error: 'לא הוגדר תאריך התחלה לסדרה'
            };
        }

        const days = storage.getWorkingDays(startDate);

        // Validate all groups have submitted
        if (preferences.length !== groups.length) {
            return {
                success: false,
                error: `לא כל הקבוצות הזינו העדפות. הוזנו: ${preferences.length} מתוך ${groups.length}`
            };
        }

        // Create results for each day
        const results = [];

        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
            const day = days[dayIndex];
            const dayKey = `day_${day.id}`;

            // Calculate scores with randomness
            const scores = groups.map(group => {
                const prefs = preferences.find(p => p.groupId === group.id);
                let score = prefs ? (prefs[dayKey] || 0) : 0;

                // Add bonus for remote teacher
                if (group.hasRemoteTeacher) {
                    score += 20;
                }

                // Add randomness to break ties
                score += Math.random();

                return {
                    groupId: group.id,
                    groupName: group.name,
                    score: score
                };
            });

            // Sort by score descending
            const sorted = scores.sort((a, b) => b.score - a.score);

            // Extract just the group IDs in order
            const order = sorted.map(s => s.groupId);

            results.push({
                dayId: day.id,
                dayDate: day.date,
                dayIndex: dayIndex,
                order: order
            });
        }

        // Save results
        storage.saveResults(results);

        return {
            success: true,
            results: results
        };
    }

    getSchedule() {
        return storage.getResults();
    }

    getScheduleForDay(dayIndex) {
        const results = storage.getResults();
        if (!results) return null;
        return results.find(r => r.dayIndex === dayIndex);
    }

    getScheduleAsTable() {
        const results = storage.getResults();
        if (!results || results.length === 0) {
            return null;
        }

        const groups = storage.getGroups();
        const maxGroupsPerDay = groups.length;

        // Create a table: rows = positions, columns = days
        const table = [];
        for (let i = 0; i < maxGroupsPerDay; i++) {
            const row = { position: i + 1 };
            for (const dayResult of results) {
                const groupId = dayResult.order[i];
                const group = groups.find(g => g.id === groupId);
                row[`day${dayResult.dayIndex}`] = {
                    groupId: groupId,
                    groupName: group?.name || 'לא ידוע'
                };
            }
            table.push(row);
        }

        return table;
    }

    clearSchedule() {
        storage.clearResults();
    }
}

// Global calculator instance
const calculator = new Calculator();
