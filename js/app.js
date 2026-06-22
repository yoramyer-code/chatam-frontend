// Main application logic
class App {
    constructor() {
        this.currentPage = null;
        this.init();
    }

    init() {
        this.setupRouting();
        this.attachGlobalEventListeners();
        this.navigateToHash();
    }

    setupRouting() {
        window.addEventListener('hashchange', () => this.navigateToHash());
    }

    navigateToHash() {
        const hash = window.location.hash.slice(1) || '/login';
        const [path, params] = hash.split('?');

        switch (path) {
            case '/login':
                this.showLoginPage();
                break;
            case '/admin':
                if (auth.requireLogin()) {
                    this.showAdminDashboard().catch(err => console.error(err));
                }
                break;
            case '/input':
                this.showInputPage();
                break;
            case '/results':
                if (auth.requireLogin()) {
                    this.showResultsPage();
                }
                break;
            default:
                window.location.hash = '#/login';
        }
    }

    showLoginPage() {
        this.currentPage = 'login';
        const container = document.getElementById('app-container');
        container.innerHTML = '';

        const template = ui.renderTemplate('login-page');
        container.appendChild(template);

        const form = document.getElementById('login-form');
        const errorEl = document.getElementById('login-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const result = await auth.login(username, password);

            if (result.success) {
                window.location.hash = '#/admin';
            } else {
                errorEl.textContent = result.error;
                errorEl.style.display = 'block';
            }
        });
    }

    async showAdminDashboard() {
        this.currentPage = 'admin';
        const container = document.getElementById('app-container');
        container.innerHTML = '';

        const template = ui.renderTemplate('admin-dashboard');
        container.appendChild(template);

        const adminName = auth.getCurrentAdminUsername();
        document.getElementById('admin-name').textContent = adminName;

        await this.setupAdminDashboard();
    }

    async setupAdminDashboard() {
        // Display series start date info
        await this.displaySeriesInfo();

        // Groups table
        ui.renderGroupsTable('groups-table-container');

        // Preferences table
        ui.renderPreferencesTable('preferences-table-container');
        ui.updatePreferencesStats();

        // Set series start date button
        document.getElementById('add-day-btn').addEventListener('click', () => {
            this.showSetSeriesStartDateModal();
        });

        // Add group button
        document.getElementById('add-group-btn').addEventListener('click', () => {
            this.showAddGroupModal();
        });

        // Edit group buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-group-btn')) {
                const groupId = e.target.dataset.id;
                this.showEditGroupModal(groupId);
            }
        });

        // Delete group buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-group-btn')) {
                const groupId = e.target.dataset.id;
                const group = storage.getGroupById(groupId);
                ui.showConfirmDialog(
                    `האם אתה בטוח שברצונך למחוק את קבוצה "${group.name}"?`,
                    () => {
                        groupManager.deleteGroup(groupId);
                        ui.showAlert('קבוצה נמחקה בהצלחה', 'success');
                        this.refreshAdminDashboard();
                    }
                );
            }
        });

        // Edit preferences buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-preferences-btn')) {
                const groupId = e.target.dataset.id;
                this.showEditPreferencesModal(groupId);
            }
        });

        // Delete preferences buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-preferences-btn')) {
                const groupId = e.target.dataset.id;
                ui.showConfirmDialog(
                    'האם אתה בטוח שברצונך למחוק את העדפות אלה?',
                    () => {
                        preferencesManager.deletePreferences(groupId);
                        ui.showAlert('העדפות נמחקו בהצלחה', 'success');
                        this.refreshAdminDashboard();
                    }
                );
            }
        });

        // Calculate button
        document.getElementById('calculate-btn').addEventListener('click', () => {
            const result = calculator.calculateSchedule();
            if (result.success) {
                ui.showAlert('סדר כניסה חושב בהצלחה!', 'success');
                window.location.hash = '#/results';
            } else {
                ui.showAlert(result.error, 'error');
            }
        });

        // Download button
        document.getElementById('download-btn').addEventListener('click', () => {
            exporter.exportToExcel();
            ui.showAlert('קובץ הורד בהצלחה', 'success');
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            ui.showConfirmDialog(
                'האם אתה בטוח? זה ימחוק את כל הנתונים!',
                () => {
                    storage.resetAll();
                    ui.showAlert('כל הנתונים אופסו', 'success');
                    this.refreshAdminDashboard();
                }
            );
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.logout();
            window.location.hash = '#/login';
        });
    }

    async displaySeriesInfo() {
        const daysContainer = document.getElementById('days-table-container');

        try {
            const days = await api.getDays();
            console.log('displaySeriesInfo - days from API:', days);

            if (!days || days.length === 0) {
                daysContainer.innerHTML = '<p class="text-center">לא הוגדרו ימי חתמצ</p>';
                return;
            }

            const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>#</th>
                        <th>תאריך</th>
                        <th>יום בשבוע</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');

            // Sort days by date
            const sortedDays = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));

            sortedDays.forEach((day, index) => {
                // Parse date - handle both formats: "2026-07-05" and "2026-07-05T00:00:00.000Z"
                let dateStr = day.date;
                if (dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0]; // Extract just the date part
                }
                const date = new Date(dateStr + 'T00:00:00');
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
                `;
                tbody.appendChild(row);
            });

            daysContainer.innerHTML = '';
            daysContainer.appendChild(table);
        } catch (error) {
            console.error('Error loading days:', error);
            daysContainer.innerHTML = '<p class="text-center error-message">שגיאה בטעינת הימים</p>';
        }
    }

    showSetSeriesStartDateModal() {
        const currentDate = storage.getSeriesStartDate();
        const hasExistingDate = !!currentDate;

        const form = document.createElement('form');
        let warningHTML = '';

        if (hasExistingDate) {
            const date = new Date(currentDate + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            warningHTML = `
                <div class="warning-box">
                    <p><strong>⚠️ תיקו!</strong></p>
                    <p>תאריך ההתחלה הנוכחי: <strong>${formattedDate}</strong></p>
                    <p>בבחירת תאריך חדש, התאריך הקודם יימחק וכל ההעדפות הקודמות יימחקו גם כן.</p>
                </div>
            `;
        }

        form.innerHTML = `
            ${warningHTML}
            <div class="form-group">
                <label for="series-start-date"><strong>בחר תאריך התחלה של הסדרה:</strong></label>
                <p class="info-text" style="font-size: 12px; margin-top: 5px;">זה יהיה יום ראשון וגם ימים שני, שלישי, רביעי (עוקבים)</p>
                <input type="date" id="series-start-date" required>
            </div>

            <div class="form-group">
                <label for="day5-date"><strong>בחר תאריך ליום חמישי נוסף:</strong></label>
                <p class="info-text" style="font-size: 12px; margin-top: 5px;">יום זה יכול להיות בכל תאריך (לא חייב להיות עוקב)</p>
                <input type="date" id="day5-date" required>
            </div>

            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-success">קבע</button>
                <button type="button" class="btn btn-secondary cancel-btn">ביטול</button>
            </div>
        `;

        const closeModal = ui.showModal('יום תחילת פעילות', form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const startDate = document.getElementById('series-start-date').value;
            const day5Date = document.getElementById('day5-date').value;

            if (hasExistingDate && currentDate !== startDate) {
                // Clear preferences if date changed
                storage.savePreferences([]);
            }

            // Save start date
            storage.setSeriesStartDate(startDate);

            // Add the 4 auto-calculated days
            try {
                const baseDate = new Date(startDate);

                // Clear ALL existing days from Database
                const existingDays = await api.getDays();
                console.log('Deleting existing days:', existingDays);
                for (const day of existingDays) {
                    try {
                        await api.deleteDay(day.id);
                        console.log('Deleted day:', day.id);
                    } catch (err) {
                        console.error('Failed to delete day', day.id, err);
                    }
                }

                // Add 4 consecutive days (Sunday-Thursday)
                for (let i = 0; i < 4; i++) {
                    const currentDate = new Date(baseDate);
                    currentDate.setDate(currentDate.getDate() + i);

                    const formattedDate = currentDate.toISOString().split('T')[0];
                    await api.addDay(formattedDate);
                }

                // Add day 5 (manual date)
                await api.addDay(day5Date);

                closeModal();
                ui.showAlert('ימי החתמצ הוגדרו בהצלחה', 'success');

                // Force reload the dashboard
                this.currentPage = null;
                await this.showAdminDashboard();
            } catch (error) {
                console.error('Error setting days:', error);
                ui.showAlert('שגיאה בהגדרת הימים', 'error');
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    showAddGroupModal() {
        const form = document.createElement('form');
        form.innerHTML = `
            <div class="form-group">
                <label for="group-name">שם הקבוצה:</label>
                <input type="text" id="group-name" required>
            </div>
            <div class="form-group">
                <label for="group-leader">שם המוביל:</label>
                <input type="text" id="group-leader" required>
            </div>
            <div class="form-group">
                <label for="group-access-code">קוד גישה (אופציונלי - יוצר אוטומטית):</label>
                <input type="text" id="group-access-code" maxlength="6">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="group-remote-teacher">
                    יש חונך רחוק (120 נקודות במקום 100)
                </label>
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-success">שמור</button>
                <button type="button" class="btn btn-secondary cancel-btn">ביטול</button>
            </div>
        `;

        const closeModal = ui.showModal('הוסף קבוצה חדשה', form);

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('group-name').value;
            const leader = document.getElementById('group-leader').value;
            const accessCode = document.getElementById('group-access-code').value || null;
            const hasRemoteTeacher = document.getElementById('group-remote-teacher').checked;

            const result = groupManager.createGroup(name, leader, accessCode, hasRemoteTeacher);

            if (result.success) {
                closeModal();
                ui.showAlert('קבוצה הוספה בהצלחה', 'success');
                this.refreshAdminDashboard();
            } else {
                ui.showAlert(result.error, 'error');
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    showEditGroupModal(groupId) {
        const group = storage.getGroupById(groupId);
        if (!group) return;

        const form = document.createElement('form');
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-group-name">שם הקבוצה:</label>
                <input type="text" id="edit-group-name" value="${group.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-group-leader">שם המוביל:</label>
                <input type="text" id="edit-group-leader" value="${group.leader}" required>
            </div>
            <div class="form-group">
                <label for="edit-group-access-code">קוד גישה:</label>
                <input type="text" id="edit-group-access-code" value="${group.accessCode}" maxlength="6" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-group-remote-teacher" ${group.hasRemoteTeacher ? 'checked' : ''}>
                    יש חונך רחוק (120 נקודות במקום 100)
                </label>
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-success">שמור שינויים</button>
                <button type="button" class="btn btn-secondary cancel-btn">ביטול</button>
            </div>
        `;

        const closeModal = ui.showModal('עריכת קבוצה', form);

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const updates = {
                name: document.getElementById('edit-group-name').value,
                leader: document.getElementById('edit-group-leader').value,
                accessCode: document.getElementById('edit-group-access-code').value,
                hasRemoteTeacher: document.getElementById('edit-group-remote-teacher').checked
            };

            const result = groupManager.updateGroup(groupId, updates);

            if (result.success) {
                closeModal();
                ui.showAlert('קבוצה עודכנה בהצלחה', 'success');
                this.refreshAdminDashboard();
            } else {
                ui.showAlert(result.error, 'error');
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    showEditPreferencesModal(groupId) {
        const group = storage.getGroupById(groupId);
        const prefs = storage.getPreferencesByGroupId(groupId);

        if (!group || !prefs) return;

        const startDate = storage.getSeriesStartDate();
        if (!startDate) {
            ui.showAlert('לא הוגדר תאריך התחלה לסדרה', 'error');
            return;
        }

        const maxPoints = groupManager.getMaxPointsForGroup(groupId);
        const days = storage.getWorkingDays(startDate);
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        const form = document.createElement('form');

        // Build header
        let headerHTML = '<tr>';
        for (const day of days) {
            let dateStr = day.date;
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }
            const date = new Date(dateStr + 'T00:00:00');
            const dayName = dayNames[date.getDay()];
            const formattedDate = date.toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            headerHTML += `<th>יום ${dayName}<br/>${formattedDate}</th>`;
        }
        headerHTML += '</tr>';

        // Build input row
        let bodyHTML = '<tr>';
        for (const day of days) {
            const dayKey = `day_${day.id}`;
            const value = prefs[dayKey] || 0;
            bodyHTML += `<td><input type="number" data-day-id="${day.id}" min="0" max="120" value="${value}" required></td>`;
        }
        bodyHTML += '</tr>';

        form.innerHTML = `
            <p><strong>${group.name}</strong></p>
            <p>סך נקודות שיש להקצות: ${maxPoints}</p>
            <table class="preferences-table">
                <thead>${headerHTML}</thead>
                <tbody>${bodyHTML}</tbody>
            </table>
            <p id="edit-prefs-validation" style="text-align: center; margin-top: 1rem;"></p>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-success" id="edit-prefs-save">שמור</button>
                <button type="button" class="btn btn-secondary cancel-btn">ביטול</button>
            </div>
        `;

        const closeModal = ui.showModal('עריכת העדפות', form);

        // Real-time validation
        const inputs = form.querySelectorAll('input[type="number"]');
        const validationEl = form.querySelector('#edit-prefs-validation');

        const updateValidation = () => {
            const total = Array.from(inputs).reduce((sum, input) => sum + parseInt(input.value || 0), 0);
            const isValid = total === maxPoints;
            validationEl.textContent = `סך הנקודות: ${total} / ${maxPoints}`;
            validationEl.style.color = isValid ? 'green' : 'red';
            form.querySelector('#edit-prefs-save').disabled = !isValid;
        };

        inputs.forEach(input => input.addEventListener('input', updateValidation));
        updateValidation();

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const preferences = {
                editedByAdmin: true,
                editedAt: new Date().toISOString()
            };

            // Collect preferences using dynamic day IDs
            for (const input of inputs) {
                const dayId = input.getAttribute('data-day-id');
                const dayKey = `day_${dayId}`;
                preferences[dayKey] = parseInt(input.value || 0);
            }

            const result = preferencesManager.updatePreferences(groupId, preferences);

            if (result.success) {
                closeModal();
                ui.showAlert('✓ העדפות נשמרו! (שונו על ידי אדמין)', 'success');
                this.refreshAdminDashboard();
            } else {
                ui.showAlert(result.error, 'error');
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', closeModal);
    }

    showInputPage() {
        this.currentPage = 'input';
        const container = document.getElementById('app-container');
        container.innerHTML = '';

        const template = ui.renderTemplate('group-input-page');
        container.appendChild(template);

        const validateCodeBtn = document.getElementById('validate-code-btn');
        const accessCodeInput = document.getElementById('access-code');

        validateCodeBtn.addEventListener('click', () => {
            const code = accessCodeInput.value.toUpperCase();

            if (!code) {
                ui.showAlert('אנא הכנס קוד גישה', 'error');
                return;
            }

            const group = storage.getGroupByAccessCode(code);

            if (!group) {
                ui.showAlert('קוד גישה לא נמצא', 'error');
                return;
            }

            // Check if already submitted
            if (preferencesManager.hasGroupSubmitted(group.id)) {
                document.getElementById('preferences-form').style.display = 'none';
                document.getElementById('already-submitted').style.display = 'block';
                document.getElementById('error-message').style.display = 'none';
                document.getElementById('success-message').style.display = 'none';
                accessCodeInput.disabled = true;
                validateCodeBtn.disabled = true;
            } else {
                this.setupInputForm(group);
            }
        });
    }

    setupInputForm(group) {
        const prefsForm = document.getElementById('preferences-form');
        const form = document.getElementById('input-form');
        const maxPoints = groupManager.getMaxPointsForGroup(group.id);
        const startDate = storage.getSeriesStartDate();

        if (!startDate) {
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-text').textContent = 'לא הוגדר תאריך התחלה לסדרה עדיין';
            return;
        }

        const days = storage.getWorkingDays(startDate);

        document.getElementById('group-name-display').textContent = group.name;
        document.getElementById('points-info').textContent =
            `מספר הנקודות שיש להקצות: ${maxPoints}`;
        document.getElementById('required-points').textContent = maxPoints;

        // Build table headers and inputs dynamically
        this.buildPreferencesTable(days);

        prefsForm.style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';

        const inputs = form.querySelectorAll('input[type="number"]');
        const totalPointsEl = document.getElementById('total-points');
        const validationMessageEl = document.getElementById('validation-message');
        const submitBtn = document.getElementById('submit-preferences-btn');

        const updateValidation = () => {
            const total = Array.from(inputs).reduce((sum, input) => sum + parseInt(input.value || 0), 0);
            totalPointsEl.textContent = total;

            if (total === maxPoints) {
                validationMessageEl.textContent = '✓ בדיקה עברה!';
                validationMessageEl.style.color = 'green';
                submitBtn.disabled = false;
            } else if (total > maxPoints) {
                const excess = total - maxPoints;
                validationMessageEl.textContent = `✗ בחרת יותר מדי! קטן ב-${excess} נקודות`;
                validationMessageEl.style.color = 'red';
                submitBtn.disabled = true;
            } else {
                const needed = maxPoints - total;
                validationMessageEl.textContent = `✗ יש להקצות עוד ${needed} נקודות`;
                validationMessageEl.style.color = 'red';
                submitBtn.disabled = true;
            }
        };

        inputs.forEach(input => input.addEventListener('input', updateValidation));

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const preferences = {};
            for (const day of days) {
                const dayKey = `day_${day.id}`;
                const input = form.querySelector(`input[data-day-id="${day.id}"]`);
                if (input) {
                    preferences[dayKey] = parseInt(input.value || 0);
                }
            }

            const result = preferencesManager.submitPreferences(group.id, preferences);

            if (result.success) {
                document.getElementById('preferences-form').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';
                document.getElementById('error-message').style.display = 'none';
            } else {
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('error-text').textContent = result.error;
            }
        });

        updateValidation();
    }

    buildPreferencesTable(days) {
        const header = document.getElementById('preferences-table-header');
        const body = document.getElementById('preferences-table-body');

        // Clear existing
        header.innerHTML = '';
        body.innerHTML = '';

        // Build header
        const headerRow = document.createElement('tr');
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

        for (const day of days) {
            let dateStr = day.date;
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }
            const date = new Date(dateStr + 'T00:00:00');
            const dayName = dayNames[date.getDay()];
            const formattedDate = date.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });

            const th = document.createElement('th');
            th.textContent = `יום ${dayName}\n${formattedDate}`;
            th.style.whiteSpace = 'pre-wrap';
            headerRow.appendChild(th);
        }
        header.appendChild(headerRow);

        // Build body with input row
        const bodyRow = document.createElement('tr');
        for (const day of days) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '120';
            input.value = '0';
            input.required = true;
            input.setAttribute('data-day-id', day.id);
            td.appendChild(input);
            bodyRow.appendChild(td);
        }
        body.appendChild(bodyRow);
    }

    showResultsPage() {
        this.currentPage = 'results';
        const container = document.getElementById('app-container');
        container.innerHTML = '';

        const template = ui.renderTemplate('results-page');
        container.appendChild(template);

        // Render both tables
        ui.renderResultsTable('results-table-container');
        ui.renderResultsByDay('results-by-day-container');

        // Ensure the first button is active
        const viewByPositionBtn = document.getElementById('view-by-position-btn');
        if (viewByPositionBtn) {
            viewByPositionBtn.classList.add('active');
        }

        // Setup event listeners using document delegation
        this.setupResultsPageListeners();
    }

    setupResultsPageListeners() {
        const self = this;

        // Add listeners to each button individually
        const viewByPositionBtn = document.getElementById('view-by-position-btn');
        if (viewByPositionBtn) {
            viewByPositionBtn.addEventListener('click', () => {
                console.log('view-by-position clicked');
                self.switchResultsView('by-position');
            });
        }

        const viewByDayBtn = document.getElementById('view-by-day-btn');
        if (viewByDayBtn) {
            viewByDayBtn.addEventListener('click', () => {
                console.log('view-by-day clicked');
                self.switchResultsView('by-day');
            });
        }

        const backBtn = document.getElementById('back-to-admin-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.hash = '#/admin';
            });
        }

        const downloadBtn = document.getElementById('download-results-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                exporter.exportToExcel();
                ui.showAlert('קובץ הורד בהצלחה', 'success');
            });
        }

        const printBtn = document.getElementById('print-results-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        const recalculateBtn = document.getElementById('recalculate-btn');
        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', () => {
                ui.showConfirmDialog(
                    'האם אתה רוצה להריץ הגרלה חדשה?',
                    () => {
                        const result = calculator.calculateSchedule();
                        if (result.success) {
                            ui.showAlert('סדר כניסה חושב מחדש בהצלחה!', 'success');
                            ui.renderResultsTable('results-table-container');
                            ui.renderResultsByDay('results-by-day-container');
                        } else {
                            ui.showAlert(result.error, 'error');
                        }
                    }
                );
            });
        }
    }

    switchResultsView(view) {
        console.log('Switching to view:', view);

        const byPositionBtn = document.getElementById('view-by-position-btn');
        const byDayBtn = document.getElementById('view-by-day-btn');
        const byPositionView = document.getElementById('view-by-position');
        const byDayView = document.getElementById('view-by-day');

        console.log('Elements found:', {
            byPositionBtn: !!byPositionBtn,
            byDayBtn: !!byDayBtn,
            byPositionView: !!byPositionView,
            byDayView: !!byDayView
        });

        if (view === 'by-position') {
            if (byPositionBtn) byPositionBtn.classList.add('active');
            if (byDayBtn) byDayBtn.classList.remove('active');
            if (byPositionView) byPositionView.style.display = 'block';
            if (byDayView) byDayView.style.display = 'none';
        } else if (view === 'by-day') {
            if (byPositionBtn) byPositionBtn.classList.remove('active');
            if (byDayBtn) byDayBtn.classList.add('active');
            if (byPositionView) byPositionView.style.display = 'none';
            if (byDayView) byDayView.style.display = 'block';
        }
    }

    async refreshAdminDashboard() {
        if (this.currentPage === 'admin') {
            await this.showAdminDashboard();
        }
    }

    attachGlobalEventListeners() {
        // Handle any global keyboard shortcuts or events
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
