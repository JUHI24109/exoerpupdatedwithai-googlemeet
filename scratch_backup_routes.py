import re
import os

# 1. Update backend/index.js
backend_path = r'c:\Users\juhie\Desktop\exo-ERP\backend\index.js'
with open(backend_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for services if they don't exist
if "userBackupService" not in content:
    backup_endpoint = """
const { sendBackupEmail } = require('./services/emailService');
const { createUserBackup } = require('./services/userBackupService');

app.post('/api/backup/user', protect, restrictTo('IT Admin'), async (req, res) => {
    try {
        const { targetEmployeeId, targetEmail } = req.body;
        if (!targetEmployeeId || !targetEmail) {
            return res.status(400).json({ error: 'Employee ID and Email are required' });
        }

        // 1. Create ZIP Backup
        const zipPath = await createUserBackup(targetEmployeeId, sequelize.models);

        // 2. Send Email
        await sendBackupEmail(targetEmail, targetEmployeeId, zipPath);

        // 3. Optional: Delete ZIP after sending to save space (comment out if you want to keep it)
        const fs = require('fs');
        setTimeout(() => {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }, 60000); // delete after 1 minute

        res.json({ message: 'Backup generated and emailed successfully' });
    } catch (err) {
        console.error('Backup Error:', err);
        res.status(500).json({ error: err.message || 'Failed to generate backup' });
    }
});
"""
    # Find a good place to insert it (e.g., right before the final module.exports or socket.io logic)
    content = content.replace("app.use('/api/notifications', notificationRoutes);", "app.use('/api/notifications', notificationRoutes);\n" + backup_endpoint)
    
    with open(backend_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added /api/backup/user to backend/index.js")

# 2. Update frontend/dashboard.html
dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
with open(dash_path, 'r', encoding='utf-8') as f:
    dash_content = f.read()

email_backup_pattern = re.compile(r'function emailBackup\(\) \{.*?\n        \}', re.DOTALL)
new_email_backup = """async function emailBackup() {
        const targetEmp = prompt('Enter the Employee ID to backup (e.g. EXO-101):');
        if (!targetEmp) return;
        const targetEmail = prompt(`Enter the email address to send ${targetEmp}'s backup to:`);
        if (!targetEmail) return;

        const btn = document.getElementById('backupBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/backup/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetEmployeeId: targetEmp, targetEmail })
            });
            const data = await res.json();
            
            if (!res.ok) {
                alert('Backup Failed: ' + (data.error || 'Unknown error'));
            } else {
                alert('Success: ' + data.message);
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred during backup');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }"""

dash_content = email_backup_pattern.sub(new_email_backup, dash_content)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash_content)
print("Updated emailBackup() in dashboard.html")
