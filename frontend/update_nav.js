const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html'); // Skip login page

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Determine class used
    const useNavLink = content.includes('class="nav-link"');
    const className = useNavLink ? 'nav-link' : 'nav-item';
    
    const newNav = `        <a href="dashboard.html" class="${className}"><i class="fa-solid fa-house"></i> Dashboard</a>
        <a href="employees.html" class="${className}"><i class="fa-solid fa-users"></i> Users</a>
        <a href="chat.html" class="${className}"><i class="fa-solid fa-message"></i> Messages</a>
        <a href="tickets.html" class="${className}"><i class="fa-solid fa-ticket"></i> Tickets</a>
        <div style="flex:1;"></div>
        <a href="profile.html" class="${className}"><i class="fa-solid fa-id-badge"></i> My Profile</a>
        <a href="#" onclick="if(window.logout) logout(event); else { localStorage.clear(); window.location.href='index.html'; }" class="${className}" style="color:var(--danger);"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>`;
    
    content = content.replace(/<nav>[\s\S]*?<\/nav>/i, `<nav>\n${newNav}\n    </nav>`);
    
    // Also remove Leave section or button entirely
    // Find the whole <div id="leavesSection"...> ... </div> block
    let leaveIdx = content.indexOf('<div id="leavesSection"');
    if (leaveIdx !== -1) {
        // We will just do a hacky regex or substring replacement since we know it's at the end of main in ceo/chairman/hr
        content = content.replace(/<!-- Leaves Section -->[\s\S]*?<\/main>/, '</main>');
    }
    
    content = content.replace(/<button[^>]*applyLeave\(\)[^>]*>[\s\S]*?<\/button>/g, '');
    content = content.replace(/<a[^>]*nav-leaves[^>]*>[\s\S]*?<\/a>/g, '');
    content = content.replace(/<a[^>]*id="nav-leaves"[^>]*>[\s\S]*?<\/a>/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
}
