# מערכת סידור כניסה לחתמצ - סיכום טכני

## 📋 מה בנינו?

**מערכת אינטרנט היברידית** להחלפת Google Forms + Excel:
- **Frontend**: HTML/CSS/JavaScript (SPA - Single Page Application)
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: JWT tokens
- **Hosting**: Render (או server משלך)

---

## 📁 מבנה הפרויקט

```
Claude/
├── index.html                    # דף הבית (Frontend)
├── css/
│   ├── style.css                # סגנונות גלובליים
│   ├── login.css                # עמוד התחברות
│   ├── admin.css                # דשבורד אדמין
│   ├── input.css                # דף הזנת העדפות
│   └── results.css              # דף התוצאות
├── js/
│   ├── api.js                   # API client (מתחבר לBackend)
│   ├── auth.js                  # ניהול התחברות
│   ├── groups.js                # ניהול קבוצות
│   ├── preferences.js           # ניהול העדפות
│   ├── calculator.js            # חישוב סדר כניסה
│   ├── ui.js                    # רכיבי UI
│   ├── app.js                   # אפליקציה ראשית
│   ├── storage.js               # (legacy - לא בשימוש כרגע)
│   ├── export.js                # יצוא תוצאות
│   └── groups.js                # (legacy)
├── backend/
│   ├── server.js                # Express server
│   ├── package.json             # Dependencies
│   ├── .env.example             # Template ל-environment variables
│   ├── db/
│   │   └── init.js              # יצירת schema PostgreSQL
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   └── routes/
│       ├── auth.js              # Login / init admins
│       ├── groups.js            # CRUD groups
│       ├── days.js              # ניהול ימים
│       ├── preferences.js       # הזנת העדפות
│       └── results.js           # חישוב + הצגת תוצאות
```

---

## 🔑 מה עושה המערכת?

### **דף התחברות** (Login)
- 3 אדמינים: admin1/password1, admin2/password2, admin3/password3
- JWT token לפעם הבאה

### **דשבורד אדמין**
1. **ניהול ימים**: בחירת עד 10 תאריכים (עם יום בשבוע)
2. **ניהול קבוצות**: הוסף/ערוך/מחק קבוצות
3. **סטטוס העדפות**: צפה אילו קבוצות הזינו
4. **חישוב סדר כניסה**: אלגוריתם עם רנדומליות לשבירת תיקו
5. **תוצאות**: הצג בשתי דרכים (לפי מיקום / לפי קבוצה)

### **דף הזנת העדפות** (לקבוצות)
- קוד גישה (access code)
- הזנת נקודות לכל יום (סכום קבוע: 100 או 120 נקודות)
- שמירה בDB

---

## 🔧 Requirements

### **Frontend**
- דפדפן מודרני (Chrome, Firefox, Safari)
- JavaScript enabled
- HTTPS (חובה לProduction)

### **Backend**
- **Node.js** v14+
- **PostgreSQL** 12+ (או managed DB כמו Render)
- **npm** או yarn

### **Dependencies** (Backend)
```
express: 4.18.2
pg: 8.11.3
cors: 2.8.5
dotenv: 16.3.1
bcrypt: 5.1.1
jsonwebtoken: 8.5.1
```

---

## 🚀 Deployment Options

### **Option 1: Render (ענן - המצב הנוכחי)**
✅ קל להתחיל
❌ Free tier איטי (cold start)
- Backend: `chatam-api.onrender.com`
- Frontend: `chatam-frontend.onrender.com`
- Database: Render PostgreSQL managed

**מה עשינו:**
- GitHub repos: `chatam-backend` + `chatam-frontend`
- Render services: Backend + Static Site + PostgreSQL
- Connection: DATABASE_URL עם SSL

**בעיה שהתגלתה:** Free tier תקוע (timeout)

---

### **Option 2: Server משלך (מומלץ אם יש hosting)**
✅ בקרה מלאה
✅ ביצועים טובים
❌ צריך ניהול

**דרישות:**
1. **SSH Access** לserver
2. **Node.js** מותקן
3. **PostgreSQL** מותקן ו-running
4. **Domain** מחוברת ל-IP של server

**Setup:**
```bash
# על ה-Server:
cd /var/www/chatam-backend
npm install
NODE_ENV=production node server.js

# Frontend:
# העלה את הקבצים האלו ל-web root:
index.html, css/, js/
```

---

### **Option 3: Localhost (לבדיקה בלבד)**
- Frontend: `http://localhost:8000`
- Backend: `http://localhost:3001`
- Database: PostgreSQL locally או SQLite

---

## 🔌 Connection String

**Render PostgreSQL** (בשימוש כרגע):
```
postgresql://chatam_db_user:ylUm0SOZHEQZIfpDY8yg0QJ8ttIdQmMm@dpg-d8s1mm7avr4c73f767jg-a.frankfurt-postgres.render.com/chatam_db?sslmode=require
```

---

## 📊 Database Schema

```sql
-- Admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255)
);

-- Groups
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  leader VARCHAR(255),
  access_code VARCHAR(20) UNIQUE,
  has_remote_teacher BOOLEAN
);

-- Days (עד 10)
CREATE TABLE days (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE,
  day_of_week INT
);

-- Preferences
CREATE TABLE preferences (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id),
  day_id INT REFERENCES days(id),
  points INT,
  edited_by_admin BOOLEAN
);

-- Results
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  day_id INT REFERENCES days(id),
  group_order TEXT (JSON array)
);
```

---

## 🔐 Security

⚠️ **Current State (Localhost/Testing)**
- Passwords: bcrypt hashed
- Auth: JWT tokens
- Database: No SSL locally

✅ **Production Requirements**
- HTTPS everywhere
- Environment variables (לא hardcoded)
- JWT secret: complex string
- Database SSL connection
- CORS configured properly

---

## 📝 Environment Variables

Create `.env` file in `backend/`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_complex_secret_key_here
NODE_ENV=production
PORT=3001
```

---

## 🎯 Next Steps

### **אם אדם ה-IT שלך ממשיך:**

1. **בחר hosting**: Render / Server משלך / Localhost
2. **התקן PostgreSQL** (אם לא managed)
3. **Clone repositories**:
   ```bash
   git clone https://github.com/yoramyer-code/chatam-backend.git
   git clone https://github.com/yoramyer-code/chatam-frontend.git
   ```
4. **Setup Backend**:
   ```bash
   cd chatam-backend
   npm install
   # Create .env with DATABASE_URL + JWT_SECRET
   node server.js
   ```
5. **Setup Frontend**:
   - Upload files ל-web server
   - או use GitHub Pages / Netlify

6. **Initialize Admins**:
   ```
   POST /api/auth/init-admins
   ```

7. **Test**:
   - Login עם admin1/password1
   - Create groups + days
   - Calculate schedule

---

## 📞 Support

**GitHub Repos:**
- Backend: https://github.com/yoramyer-code/chatam-backend
- Frontend: https://github.com/yoramyer-code/chatam-frontend

**API Endpoints:**
- Health: `GET /api/health`
- Login: `POST /api/auth/login`
- Groups: `GET/POST/PUT/DELETE /api/groups`
- Days: `GET/POST/DELETE /api/days`
- Preferences: `GET/POST/PUT /api/preferences/:groupId`
- Results: `POST /api/results/calculate`

---

## 📋 Checklist

- [ ] PostgreSQL DB בפעם
- [ ] Backend dependencies installed
- [ ] .env configured
- [ ] Frontend connected to Backend URL
- [ ] Admin account created
- [ ] Test: Login → Create groups → Calculate schedule
- [ ] SSL/HTTPS configured (Production)
- [ ] Domain DNS updated

---

**סטטוס כרגע:** Backend + Frontend בנויים, Database מוכן, צריך hosting/deployment.
