import os
import glob
from bs4 import BeautifulSoup

generic_sidebar_html = """
<aside id="sidebar">
    <div class="logo"><img src="exologo.png?v=2" class="sidebar-logo" style="width:80px;height:80px;border-radius:8px;object-fit:contain;"/></div>
    <nav>
        <a href="dashboard.html" class="nav-link"><i class="fa-solid fa-house"></i> Dashboard</a>
        <a href="employees.html" class="nav-link"><i class="fa-solid fa-users"></i> Employees</a>
        <a href="attendance.html" class="nav-link"><i class="fa-solid fa-user-check"></i> Attendance</a>
        <a href="tickets.html" class="nav-link"><i class="fa-solid fa-ticket"></i> Tickets</a>
        <a href="chat.html" class="nav-link"><i class="fa-solid fa-message"></i> Chat</a>
        <a href="meeting.html" class="nav-link"><i class="fa-solid fa-video"></i> Live Meeting</a>
        <a href="documents.html" class="nav-link"><i class="fa-solid fa-folder-open"></i> Documents</a>
        <a href="history.html" class="nav-link"><i class="fa-solid fa-clock-rotate-left"></i> History Center</a>
        <a href="undertakings.html" class="nav-link" id="navUndertakings" style="display:none;"><i class="fa-solid fa-handshake"></i> Undertakings</a>
        <div style="flex:1"></div>
        <a href="profile.html" class="nav-link"><i class="fa-solid fa-id-badge"></i> My Profile</a>
        <a href="javascript:void(0)" onclick="logout()" class="nav-link" style="color:var(--danger)"><i class="fa-solid fa-power-off"></i> Logout</a>
    </nav>
</aside>
"""

sidebar_css = """
/* ── SIDEBAR ── */
#sidebar{width:250px;background:#1e293b;border-right:2px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;}
@media (min-width: 769px) { #sidebar { height: 100vh; position: sticky; top: 0; } }
.logo{height:100px;padding:0 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;justify-content:center;}
.logo-icon{width:52px;height:52px;border-radius:8px;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden;border:none}
.logo-icon img{width:100%;height:100%;object-fit:contain;border-radius:8px}
.logo-text{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;color:#fff}
#sidebar nav{flex:1;padding:18px 12px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;}
.nav-link{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:4px;color:#ffffff;text-decoration:none;font-weight:600;transition:.2s;border:1px solid transparent;font-size:13px}
.nav-link:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.05)}
.nav-link.active{background:rgba(14,165,233,0.15);border:1px solid var(--primary);box-shadow:inset 3px 0 0 var(--primary)}
.nav-link .count-badge{background:var(--primary);color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;margin-left:auto}
"""

files = glob.glob('c:/Users/juhie/Desktop/exo-ERP/frontend/*.html')

for file in files:
    filename = os.path.basename(file)
    if filename in ['index.html', 'forgot.html']:
        continue
        
    print(f"Processing {filename}...")
    with open(file, 'r', encoding='utf-8') as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'lxml') # using lxml to preserve structure as much as possible, though bs4 might reformat
    
    # Actually, bs4 might strip formatting or alter tags we don't want.
    # We can do exact string replacements by using re, but carefully.
    import re
    # Find existing sidebar
    content = html
    # Match <aside id="sidebar"> ... </aside> OR <aside class="sidebar"> ... </aside>
    content = re.sub(r'<aside\s+(?:id=\"sidebar\"|class=\"sidebar\")[^>]*>.*?</aside>', generic_sidebar_html, content, flags=re.DOTALL)
    
    # Ensure nav-sync.js is included
    if 'nav-sync.js' not in content:
        content = content.replace('</body>', '    <script src="/js/nav-sync.js"></script>\n</body>')
        
    # Inject CSS
    if '<style>' in content and '/* ── SIDEBAR ── */' not in content:
        content = content.replace('</style>', sidebar_css + '\n</style>')
        
    # For chat.html, #sidebar uses class "sidebar", but we replaced it with <aside id="sidebar">. 
    # Let's make sure it doesn't break chat layout. chat.html has `.app-container` and `.sidebar`.
    if filename == 'chat.html':
        content = content.replace('<aside id="sidebar">', '<aside id="sidebar" class="sidebar">')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done sidebars update!")
