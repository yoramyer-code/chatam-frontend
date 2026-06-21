// UI utilities and components
class UIUtils {
    renderTemplate(templateId) {
        const template = document.querySelector(`#${templateId}`);
        if (!template) {
            console.error(`Template ${templateId} not found`);
            return null;
        }
        return template.content.cloneNode(true);
    }

    clearContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    renderDaysTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const days = storage.getDays();

        if (days.length === 0) {
            container.innerHTML = '<p class="text-center">לא הוגדרו ימים לחתמצ עדיין</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>תאריך</th>
                    <th>יום בשבוע</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        days.forEach((day, index) => {
            const date = new Date(day.date + 'T00:00:00');
            const dayName = dayNames[date.getDay()];
            const formattedDate = date.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td>יום ${dayName}</td>
                <td>
                    <button class="btn btn-danger delete-day-btn" data-id="${day.id}">מחיקה</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderGroupsTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const groups = storage.getGroups();

        if (groups.length === 0) {
            container.innerHTML = '<p class="text-center">אין קבוצות בעדיין</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>שם קבוצה</th>
                    <th>מוביל</th>
                    <th>קוד גישה</th>
                    <th>חונך רחוק</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        groups.forEach((group, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${group.name}</td>
                <td>${group.leader}</td>
                <td><code>${group.accessCode}</code></td>
                <td>${group.hasRemoteTeacher ? '✓' : '✗'}</td>
                <td>
                    <button class="btn btn-primary edit-group-btn" data-id="${group.id}">עריכה</button>
                    <button class="btn btn-danger delete-group-btn" data-id="${group.id}">מחיקה</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderPreferencesTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const groups = groupManager.getGroupsWithSubmissionStatus();

        if (groups.length === 0) {
            container.innerHTML = '<p class="text-center">אין קבוצות בעדיין</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>שם קבוצה</th>
                    <th>סטטוס</th>
                    <th>יום ראשון</th>
                    <th>יום שני</th>
                    <th>יום שלישי</th>
                    <th>יום רביעי</th>
                    <th>יום חמישי</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        groups.forEach(group => {
            const row = document.createElement('tr');
            let statusBadge = group.hasSubmitted
                ? '<span class="badge badge-success">✓ הוזנו</span>'
                : '<span class="badge badge-danger">✗ ממתינות</span>';

            // Add admin edit indicator
            if (group.preferences && group.preferences.editedByAdmin) {
                statusBadge += '<br><span class="badge badge-info" style="margin-top: 0.25rem;">✎ שנו ידנית</span>';
            }

            let prefsHTML = '';
            if (group.preferences) {
                prefsHTML = `
                    <td>${group.preferences.day1 || '-'}</td>
                    <td>${group.preferences.day2 || '-'}</td>
                    <td>${group.preferences.day3 || '-'}</td>
                    <td>${group.preferences.day4 || '-'}</td>
                    <td>${group.preferences.day5 || '-'}</td>
                `;
            } else {
                prefsHTML = '<td colspan="5" class="text-center">-</td>';
            }

            row.innerHTML = `
                <td>${group.name}</td>
                <td>${statusBadge}</td>
                ${prefsHTML}
                <td>
                    ${group.hasSubmitted ? `
                        <button class="btn btn-primary edit-preferences-btn" data-id="${group.id}">עריכה</button>
                        <button class="btn btn-danger delete-preferences-btn" data-id="${group.id}">מחק</button>
                    ` : '<span class="small-text">טרם הוזנו</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderResultsTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const schedule = calculator.getSchedule();
        if (!schedule || schedule.length === 0) {
            container.innerHTML = '<p class="text-center">עדיין לא חושב סדר כניסה</p>';
            return;
        }

        const groups = storage.getGroups();
        const table = document.createElement('table');
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        // Header
        let headerHTML = '<tr><th>מיקום בתור</th>';
        for (const result of schedule) {
            const date = new Date(result.dayDate + 'T00:00:00');
            const dayName = dayNames[date.getDay()];
            const formattedDate = date.toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            headerHTML += `<th>יום ${dayName}<br/>${formattedDate}</th>`;
        }
        headerHTML += '</tr>';

        table.innerHTML = `<thead>${headerHTML}</thead><tbody></tbody>`;

        const tbody = table.querySelector('tbody');
        const maxRows = groups.length;

        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('tr');
            let rowHTML = `<td>${i + 1}</td>`;

            for (const result of schedule) {
                const groupId = result.order[i];
                const group = groups.find(g => g.id === groupId);
                const groupName = group ? group.name : 'לא ידוע';
                rowHTML += `<td>${groupName}</td>`;
            }

            row.innerHTML = rowHTML;
            tbody.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderResultsByDay(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const schedule = calculator.getSchedule();
        if (!schedule || schedule.length === 0) {
            container.innerHTML = '<p class="text-center">עדיין לא חושב סדר כניסה</p>';
            return;
        }

        const groups = storage.getGroups();
        const table = document.createElement('table');
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        // Header: קבוצה | יום 1 | יום 2 | ... | יום N
        let headerHTML = '<tr><th>קבוצה</th>';
        for (const result of schedule) {
            const date = new Date(result.dayDate + 'T00:00:00');
            const dayName = dayNames[date.getDay()];
            const formattedDate = date.toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            headerHTML += `<th>יום ${dayName}<br/>${formattedDate}</th>`;
        }
        headerHTML += '</tr>';

        table.innerHTML = `<thead>${headerHTML}</thead><tbody></tbody>`;

        const tbody = table.querySelector('tbody');

        // For each group
        for (const group of groups) {
            const row = document.createElement('tr');
            let rowHTML = `<td><strong>${group.name}</strong></td>`;

            // For each day, find the position of this group
            for (const result of schedule) {
                const position = result.order.indexOf(group.id) + 1; // 1-indexed
                rowHTML += `<td>${position}</td>`;
            }

            row.innerHTML = rowHTML;
            tbody.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(table);
    }

    showModal(title, content) {
        const modalBackdrop = document.getElementById('modal-backdrop');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        if (!modalBackdrop) {
            const template = this.renderTemplate('modal-template');
            document.body.appendChild(template);
        }

        const backdrop = document.getElementById('modal-backdrop');
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');

        titleEl.textContent = title;
        contentEl.innerHTML = '';
        if (typeof content === 'string') {
            contentEl.innerHTML = content;
        } else {
            contentEl.appendChild(content);
        }

        backdrop.style.display = 'flex';

        const closeModal = () => {
            backdrop.style.display = 'none';
        };

        document.getElementById('modal-close-btn').onclick = closeModal;
        backdrop.onclick = (e) => {
            if (e.target === backdrop) closeModal();
        };

        return closeModal;
    }

    showConfirmDialog(message, onConfirm, onCancel) {
        const content = `
            <p>${message}</p>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button id="confirm-yes" class="btn btn-success">כן</button>
                <button id="confirm-no" class="btn btn-secondary">לא</button>
            </div>
        `;

        const closeModal = this.showModal('אישור', content);

        document.getElementById('confirm-yes').onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        document.getElementById('confirm-no').onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
    }

    showAlert(message, type = 'info') {
        const template = document.createElement('div');
        template.className = `message-box ${type}`;
        template.innerHTML = `<p>${message}</p>`;

        const container = document.getElementById('app-container');
        if (container) {
            const existing = container.querySelector('.message-box');
            if (existing) existing.remove();
            container.insertBefore(template, container.firstChild);
        }

        setTimeout(() => {
            if (template.parentNode) {
                template.remove();
            }
        }, 5000);
    }

    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    updatePreferencesStats() {
        const stats = groupManager.getSubmissionStats();
        const statsEl = document.getElementById('preferences-stats');
        if (statsEl) {
            statsEl.textContent = `${stats.submitted}/${stats.total} (${stats.percentComplete}%)`;
        }
    }
}

// Global UI utils instance
const ui = new UIUtils();
