# EXO GLOBAL Enterprise ERP
**Production-Ready Multinational Resource Planning System**

## 🚀 Overview
EXO GLOBAL ERP is a comprehensive, scalable, and secure enterprise solution designed for high-performance team management. It features a modern Glassmorphism UI, a robust Task-Ticket Workflow Engine, Real-time Chat, and deep BI Analytics.

## 🛠 Tech Stack
- **Frontend**: HTML5, Vanilla CSS (Premium Aesthetics), JS (ES6+), Socket.io Client.
- **Backend**: Node.js, Express, Sequelize (PostgreSQL/MySQL support).
- **Messaging**: Socket.io (Internal), Twilio API (WhatsApp Notifications).
- **Security**: JWT Authentication, Bcrypt Hashing, Role-Based Access Control (RBAC).

## 🔑 Key Features
1. **Hierarchical RBAC**: IT Admin, Chairman, CEO, CFO, Directors, Managers, Employees.
2. **Task Workflow**: Advanced ticket system with `ticketId` (e.g., EXO-TKT-2601), activity trails, and collaborators.
3. **Enterprise Chat**: Direct & Group chats with Administrative Audit Mode for CXOs.
4. **Attendance System**: Live tracking with 6:30 PM automated WhatsApp reporting (>9h Green logic).
5. **BI Dashboard**: Premium data visualization with Power BI integration and real-time performance metrics.

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL or MySQL Database
- Twilio Account (for WhatsApp)

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/exo_erp
JWT_SECRET=your_super_secret_key
TWILIO_SID=your_sid
TWILIO_TOKEN=your_token
TWILIO_PHONE=whatsapp:+14155238886
APP_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Run the Application
```bash
npm start
```
The frontend is served from the `backend/` as static files in this configuration. Open `http://localhost:5000` in your browser.

## 📋 Role Access Matrix
- **IT Administrator**: God-mode. Full access to all data, chat monitoring, and deletion rights.
- **Chairman/CEO**: Full visibility. Can create accounts, monitor all chats, and view all dashboards.
- **CFO**: Custom permissions (Payroll, Attendance, etc.).
- **HR/Manager**: Department management, Task assignment.
- **Employee**: Daily tasks, chat, personal attendance.

## 🔒 Security Policy
- Administrative actions (deletions/group creation) are logged with audit trails.
- All documents (ID, Passport) are structured for secure cloud storage (AWS S3 Ready).
- Only Top-Level Executives can create login accounts.

---
© 2026 EXO GLOBAL — Confidential & Proprietary.
