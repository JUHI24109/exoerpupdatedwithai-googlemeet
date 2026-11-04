import re

dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Modal HTML just before </body>
modal_html = """
    <!-- Backup Modal -->
    <div id="backupModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
        <div style="background:white; padding:24px; border-radius:12px; width:350px; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; font-family:'Outfit', sans-serif; font-size:18px; color:var(--primary-dark);">Generate Backup</h3>
            <p style="font-size:13px; color:var(--text-light); margin-bottom:16px;">Export employee data and documents securely.</p>
            
            <label style="font-size:12px; font-weight:600; color:var(--text-main); margin-bottom:4px; display:block;">Employee ID</label>
            <input type="text" id="backupEmpId" placeholder="e.g. EXO-101" style="width:100%; padding:8px 12px; border:1px solid var(--border-soft); border-radius:6px; margin-bottom:16px; box-sizing:border-box;">
            
            <label style="font-size:12px; font-weight:600; color:var(--text-main); margin-bottom:4px; display:block;">Target Email</label>
            <input type="email" id="backupEmail" placeholder="your-email@outlook.com" style="width:100%; padding:8px 12px; border:1px solid var(--border-soft); border-radius:6px; margin-bottom:20px; box-sizing:border-box;">
            
            <div id="backupMessage" style="font-size:12px; margin-bottom:12px; display:none;"></div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="document.getElementById('backupModal').style.display='none'" style="padding:8px 16px; border:1px solid var(--border-soft); background:white; color:var(--text-main); border-radius:6px; cursor:pointer; font-weight:500;">Cancel</button>
                <button id="backupSubmitBtn" onclick="processBackup()" style="padding:8px 16px; border:none; background:var(--primary); color:white; border-radius:6px; cursor:pointer; font-weight:500;">Send Backup</button>
            </div>
        </div>
    </div>
"""
if "id=\"backupModal\"" not in content:
    content = content.replace("</body>", modal_html + "\n</body>")

# 2. Replace emailBackup() function
email_func_pattern = re.compile(r'async function emailBackup\(\) \{.*?\n    \}', re.DOTALL)
new_email_func = """function emailBackup() {
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
        }

        const btn = document.getElementById('backupSubmitBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
        msgBox.style.display = 'block';
        msgBox.style.color = 'var(--text-light)';
        msgBox.innerText = 'Extracting data... This may take a minute.';

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/backup/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetEmployeeId: targetEmp, targetEmail })
            });
            const data = await res.json();
            
            if (!res.ok) {
                msgBox.style.color = 'var(--danger)';
                msgBox.innerText = 'Backup Failed: ' + (data.error || 'Unknown error');
            } else {
                msgBox.style.color = 'var(--success)';
                msgBox.innerText = 'Success! Backup has been emailed.';
                setTimeout(() => {
                    document.getElementById('backupModal').style.display = 'none';
                }, 3000);
            }
        } catch (e) {
            console.error(e);
            msgBox.style.color = 'var(--danger)';
            msgBox.innerText = 'A network error occurred.';
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }"""

content = email_func_pattern.sub(new_email_func, content)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Backup Modal UI")
