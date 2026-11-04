import os

generic_sidebar_html = """
<aside id="sidebar" style="width:250px;background:#1e293b;border-right:2px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;height:100vh;">
    <div class="logo" style="height:100px;padding:0 22px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:12px;justify-content:center;">
        <img src="exologo.png?v=2" class="sidebar-logo" style="width:80px;height:80px;border-radius:8px;object-fit:contain;"/>
    </div>
    <nav style="flex:1;padding:18px 12px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;">
        <a href="dashboard.html" class="nav-link"><i class="fa-solid fa-house"></i> Dashboard</a>
        <a href="employees.html" class="nav-link"><i class="fa-solid fa-users"></i> Employees</a>
        <a href="attendance.html" class="nav-link"><i class="fa-solid fa-user-check"></i> Attendance</a>
        <a href="tickets.html" class="nav-link"><i class="fa-solid fa-ticket"></i> Tickets</a>
        <a href="chat.html" class="nav-link active"><i class="fa-solid fa-message"></i> Chat</a>
        <a href="meeting.html" class="nav-link"><i class="fa-solid fa-video"></i> Live Meeting</a>
        <a href="documents.html" class="nav-link"><i class="fa-solid fa-folder-open"></i> Documents</a>
        <a href="history.html" class="nav-link"><i class="fa-solid fa-clock-rotate-left"></i> History Center</a>
        <a href="undertakings.html" class="nav-link" id="navUndertakings" style="display:none;"><i class="fa-solid fa-handshake"></i> Undertakings</a>
        <div style="flex:1"></div>
        <a href="profile.html" class="nav-link"><i class="fa-solid fa-id-badge"></i> My Profile</a>
        <a href="javascript:void(0)" onclick="logout()" class="nav-link" style="color:#ef4444"><i class="fa-solid fa-power-off"></i> Logout</a>
    </nav>
</aside>
"""

nav_css = """
<style>
.nav-link{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:4px;color:#ffffff;text-decoration:none;font-weight:600;transition:.2s;border:1px solid transparent;font-size:13px}
.nav-link:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.05)}
.nav-link.active{background:rgba(14,165,233,0.15);border:1px solid #3b82f6;box-shadow:inset 3px 0 0 #3b82f6}
</style>
</head>
"""

chat_css = """
        .user-item.active { background: #ebebeb; }
        .user-item.unread { background: #d9fdd3 !important; }
        .user-item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--wa-accent); opacity: 0; transition: 0.2s; }
"""

with open('c:/Users/juhie/Desktop/exo-ERP/frontend/chat.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.user-item.active { background: #ebebeb; }\n        .user-item::before { content: \'\'; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--wa-accent); opacity: 0; transition: 0.2s; }', chat_css)

content = content.replace('</head>', nav_css)

content = content.replace('<div class="app-container">\n\n    <aside class="sidebar">', '<div class="app-container">\n' + generic_sidebar_html + '\n    <aside class="sidebar">')

with open('c:/Users/juhie/Desktop/exo-ERP/frontend/chat.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Chat fixed!")
