import re
import os

backend_path = r'c:\Users\juhie\Desktop\exo-ERP\backend\index.js'
dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
service_path = r'c:\Users\juhie\Desktop\exo-ERP\backend\services\systemBackupService.js'

# 1. Create systemBackupService.js
system_backup_code = """const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createSystemBackup(sequelizeModels) {
    const { User, Task, Ticket, Attendance, Reminder, TodoItem, Message, Group } = sequelizeModels;
    
    // Fetch ALL records from major tables
    const allUsers = await User.findAll({ attributes: { exclude: ['password'] } });
    const allTasks = await Task.findAll();
    const allTickets = await Ticket.findAll();
    const allAttendance = await Attendance.findAll();
    
    const backupData = {
        users: allUsers,
        tasks: allTasks,
        tickets: allTickets,
        attendance: allAttendance,
        timestamp: new Date().toISOString()
    };

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const zipFileName = `system_backup_${Date.now()}.zip`;
    const zipPath = path.join(backupDir, zipFileName);

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(zipPath));
        archive.on('warning', (err) => { if (err.code !== 'ENOENT') reject(err); });
        archive.on('error', reject);

        archive.pipe(output);

        // Append Data JSON
        archive.append(JSON.stringify(backupData, null, 2), { name: 'full_database_dump.json' });

        // Append entire uploads Folder
        const uploadsFolder = path.join(__dirname, '..', 'uploads');
        if (fs.existsSync(uploadsFolder)) {
            archive.directory(uploadsFolder, 'uploads');
        }

        archive.finalize();
    });
}

module.exports = { createSystemBackup };
"""
with open(service_path, 'w', encoding='utf-8') as f:
    f.write(system_backup_code)

# 2. Update backend/index.js
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

# Replace user backup endpoint with system backup endpoint
old_endpoint = """app.post('/api/backup/user', protect, restrictTo('IT Admin'), async (req, res) => {
    try {
        const { targetEmployeeId, targetEmail } = req.body;
        if (!targetEmployeeId || !targetEmail) {
            return res.status(400).json({ error: 'Employee ID and Email are required' });
        }

        // 1. Create ZIP Backup
        const zipPath = await createUserBackup(targetEmployeeId, sequelize.models);

        // 2. Send Email
        await sendBackupEmail(targetEmail, targetEmployeeId, zipPath);"""

new_endpoint = """const { createSystemBackup } = require('./services/systemBackupService');
app.post('/api/backup/system', protect, restrictTo('IT Admin'), async (req, res) => {
    try {
        const { targetEmail } = req.body;
        if (!targetEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Create Full ZIP Backup
        const zipPath = await createSystemBackup(sequelize.models);

        // 2. Send Email
        await sendBackupEmail(targetEmail, 'FULL_SYSTEM', zipPath);"""

if "app.post('/api/backup/system'" not in backend_content:
    backend_content = backend_content.replace(old_endpoint, new_endpoint)
    with open(backend_path, 'w', encoding='utf-8') as f:
        f.write(backend_content)

# 3. Update dashboard.html Modal and Logic
with open(dash_path, 'r', encoding='utf-8') as f:
    dash_content = f.read()

# Remove Employee ID field
dash_content = re.sub(r'<label.*?Employee ID.*?</label>.*?<input type="text" id="backupEmpId".*?>', '', dash_content, flags=re.DOTALL)

# Update Javascript
old_js = """function emailBackup() {
        document.getElementById('backupModal').style.display = 'flex';
        document.getElementById('backupMessage').style.display = 'none';
        document.getElementById('backupEmpId').value = '';
        document.getElementById('backupEmail').value = '';
    }

    async function processBackup() {
        const targetEmp = document.getElementById('backupEmpId').value.trim();
        const targetEmail = document.getElementById('backupEmail').value.trim();
        const msgBox = document.getElementById('backupMessage');

        if (!targetEmp || !targetEmail) {
            msgBox.style.display = 'block';
            msgBox.style.color = 'var(--danger)';
            msgBox.innerText = 'Please fill in both fields.';
            return;
        }"""

new_js = """function emailBackup() {
        document.getElementById('backupModal').style.display = 'flex';
        document.getElementById('backupMessage').style.display = 'none';
        document.getElementById('backupEmail').value = '';
    }

    async function processBackup() {
        const targetEmail = document.getElementById('backupEmail').value.trim();
        const msgBox = document.getElementById('backupMessage');

        if (!targetEmail) {
            msgBox.style.display = 'block';
            msgBox.style.color = 'var(--danger)';
            msgBox.innerText = 'Please provide an email address.';
            return;
        }"""

dash_content = dash_content.replace(old_js, new_js)
dash_content = dash_content.replace("targetEmployeeId: targetEmp, targetEmail", "targetEmail")
dash_content = dash_content.replace("'/api/backup/user'", "'/api/backup/system'")

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash_content)

print("System Backup updated successfully.")
