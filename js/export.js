// Export functionality
class Exporter {
    exportToCSV() {
        const results = calculator.getSchedule();
        if (!results || results.length === 0) {
            return null;
        }

        const groups = storage.getGroups();
        const table = calculator.getScheduleAsTable();

        let csv = 'מיקום בתור';
        for (const result of results) {
            csv += `,יום ${result.day}`;
        }
        csv += '\n';

        for (const row of table) {
            csv += row.position;
            for (const result of results) {
                const cell = row[`day${result.dayIndex}`];
                const value = cell ? `${cell.groupName}` : '';
                csv += `,"${value}"`;
            }
            csv += '\n';
        }

        return csv;
    }

    exportToExcel() {
        // Since we don't have a proper Excel library, we'll create a downloadable CSV
        // that can be opened in Excel
        const csv = this.exportToCSV();
        if (!csv) return null;

        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `schedule-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }

    exportPreferencesToCSV() {
        const groups = storage.getGroups();
        const preferences = storage.getPreferences();

        let csv = 'שם קבוצה,מוביל,יום ראשון,יום שני,יום שלישי,יום רביעי,יום חמישי,סך הכל,קוד גישה\n';

        for (const group of groups) {
            const prefs = preferences.find(p => p.groupId === group.id);
            const day1 = prefs?.day1 || 0;
            const day2 = prefs?.day2 || 0;
            const day3 = prefs?.day3 || 0;
            const day4 = prefs?.day4 || 0;
            const day5 = prefs?.day5 || 0;
            const total = day1 + day2 + day3 + day4 + day5;

            csv += `"${group.name}","${group.leader}",${day1},${day2},${day3},${day4},${day5},${total},"${group.accessCode}"\n`;
        }

        return csv;
    }

    exportPreferencesToExcel() {
        const csv = this.exportPreferencesToCSV();
        if (!csv) return null;

        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `preferences-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }

    exportAllData() {
        const data = storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `backup-${timestamp}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }
}

// Global exporter instance
const exporter = new Exporter();
