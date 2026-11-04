import os
import re

base_dir = r'c:\Users\juhie\Desktop\exo-ERP\frontend'
dash_path = os.path.join(base_dir, 'dashboard.html')

with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Chart.js script tag
old_script = """<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js">
    async function downloadBackup() {
        try {
            const res = await fetch('/api/backup/tickets', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return alert('Backup failed or unauthorized');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'EXO_TICKETS_BACKUP_' + new Date().getTime() + '.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            alert('✅ Secure Database Backup Downloaded Successfully!');
        } catch(e) { console.error('Backup error:', e); alert('Failed to download backup.'); }
    }
</script>"""

new_script = """<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
    function emailBackup() {
        const userEmail = prompt('Enter your email to receive the backup:');
        if (userEmail) {
            window.location.href = `mailto:${userEmail}?subject=EXO ERP Database Backup Request&body=Please find the requested backup attached or linked.`;
        }
    }
</script>"""

if old_script in content:
    content = content.replace(old_script, new_script)

# 2. Update Backup button
old_btn = '<button onclick="downloadBackup()" id="backupBtn"'
new_btn = '<button onclick="emailBackup()" id="backupBtn"'
content = content.replace(old_btn, new_btn)
content = content.replace('<i class="fa-solid fa-cloud-arrow-down"></i> Secure DB Backup', '<i class="fa-solid fa-envelope"></i> Email DB Backup')

# 3. Fix grid for charts
old_grid = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">'
new_grid = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px;">'
content = content.replace(old_grid, new_grid)

# 4. Remove duplicate loose chart code
dup_pattern = re.compile(r'\}\s*Chart\.defaults\.font\.family.*?\}\s*</script>', re.DOTALL)
match = dup_pattern.search(content)
if match:
    content = content[:match.start() + 1] + '\n</script>' + content[match.end():]

# Add nav-sync.js and logo-fix.js at the end
if 'nav-sync.js' not in content:
    content = content.replace('</body>', '<script src="/js/nav-sync.js"></script>\n<script src="/js/logo-fix.js"></script>\n</body>')

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("dashboard.html fixed")

# Update history.js
hist_path = os.path.join(base_dir, 'js', 'history.js')
if os.path.exists(hist_path):
    with open(hist_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("try { await loadCounts(); } catch (e) { console.error('Counts load error', e); }", "")

    with open(hist_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("history.js fixed")

# Update sidebars to remove EXO GLOBAL
files = ['profile.html', 'tasks.html', 'chat.html', 'undertakings.html']
for filename in files:
    path = os.path.join(base_dir, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logo_pattern = re.compile(r'<div class="logo(-box)?">.*?</div>\s*<div class="logo-text">EXO GLOBAL</div>', re.DOTALL)
        content = logo_pattern.sub(r'<img src="logo.jpeg" class="sidebar-logo" style="width:60px;height:60px;border-radius:8px;object-fit:contain;"/>', content)
        
        logo_pattern2 = re.compile(r'<div class="logo"><i class=".*?"></i>\s*EXO GLOBAL</div>')
        content = logo_pattern2.sub(r'<div class="logo"><img src="logo.jpeg" class="sidebar-logo" style="width:60px;height:60px;border-radius:8px;object-fit:contain;"/></div>', content)

        if 'logo-fix.js' not in content:
            content = content.replace('</body>', '<script src="js/logo-fix.js"></script>\n</body>')
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"{filename} fixed")
