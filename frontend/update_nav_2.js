const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Determine class used
    const useNavLink = content.includes('class="nav-link"');
    const className = useNavLink ? 'nav-link' : 'nav-item';
    
    // The user wants ALL options visible right here.
    // Dashboard, Users, Tasks, Attendance, Messages, Tickets, My Profile
    const newNav = `        <a href="dashboard.html" class="${className}"><i class="fa-solid fa-house"></i> Dashboard</a>
        <a href="employees.html" class="${className}"><i class="fa-solid fa-users"></i> Users</a>
        <a href="tasks.html" class="${className}"><i class="fa-solid fa-list-check"></i> Tasks</a>
        <a href="attendance.html" class="${className}"><i class="fa-solid fa-calendar-check"></i> Attendance</a>
        <a href="chat.html" class="${className}"><i class="fa-solid fa-message"></i> Messages</a>
        <a href="tickets.html" class="${className}"><i class="fa-solid fa-ticket"></i> Tickets</a>
        <div style="flex:1;"></div>
        <a href="profile.html" class="${className}"><i class="fa-solid fa-id-badge"></i> My Profile</a>
        <a href="#" onclick="if(window.logout) logout(event); else { localStorage.clear(); window.location.href='index.html'; }" class="${className}" style="color:var(--danger);"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>`;
    
    if (content.includes('<nav>')) {
        content = content.replace(/<nav>[\s\S]*?<\/nav>/i, `<nav>\n${newNav}\n    </nav>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated nav in', file);
    }
}
