const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const dashFiles = ['dashboard-employee.html', 'dashboard-hr.html'];

const globalOpsHTML = `
            <!-- Operations Throughput (Global To-Dos) -->
            <div class="card" style="grid-column: span 12; margin-top: 20px;">
                <div class="card-header" style="background:var(--primary); color:white; font-size:16px;">
                    <i class="fa-solid fa-gears"></i> Operations Throughput (Company To-Dos & Reminders)
                </div>
                <div class="card-body" style="padding:0; overflow-y:auto; max-height:400px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead><tr><th style="padding:15px; border-bottom:1px solid var(--border);">Employee</th><th style="padding:15px; border-bottom:1px solid var(--border);">To-Do Task</th><th style="padding:15px; border-bottom:1px solid var(--border);">Monthly Reminder</th><th style="padding:15px; border-bottom:1px solid var(--border);">Status</th></tr></thead>
                        <tbody id="globalTodoTable"><tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-light);">Loading operations...</td></tr></tbody>
                    </table>
                </div>
            </div>
`;

const globalTodoJS = `
async function loadGlobalTodos() {
    try {
        const res = await fetch('/api/todos/all', { headers: { Authorization: \`Bearer \${token}\` } });
        const todos = await res.json();
        const tbody = document.getElementById('globalTodoTable');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!todos.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:15px;">No tasks in pipeline</td></tr>';
            return;
        }
        todos.forEach(t => {
            const empName = t.User ? t.User.fullName : 'Unknown';
            const role = t.User ? t.User.role : '';
            const isDone = t.isDeleted || t.status === 'Completed';
            tbody.innerHTML += \`
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:15px;"><div style="font-weight:600;">\${empName}</div><div style="font-size:10px;color:var(--text-light);">\${role}</div></td>
                    <td style="padding:15px; \${isDone ? 'text-decoration:line-through;color:var(--text-light);' : ''}">\${t.title}</td>
                    <td style="padding:15px;"><span style="padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; background:#eef2ff;color:#4f46e5;">\${t.reminderMonth || 'None'}</span></td>
                    <td style="padding:15px;">\${isDone ? '<span style="color:var(--success); font-weight:600;"><i class="fa-solid fa-check"></i> Done</span>' : '<span style="color:var(--warning); font-weight:600;"><i class="fa-solid fa-clock"></i> Pending</span>'}</td>
                </tr>
            \`;
        });
    } catch(e) { console.error('Global Todo Error:', e); }
}
`;

dashFiles.forEach(file => {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Inject globalOpsHTML into main dashboard view
    if (!content.includes('id="globalTodoTable"')) {
        // Find where to append. After "dashTodoWidget" card is good.
        if (content.includes('id="dashTodoWidget"')) {
            content = content.replace(/(id="dashTodoWidget"[\s\S]*?<\/div>\s*<\/div>)/, '$1' + '\n' + globalOpsHTML);
        } else if (content.includes('<div class="bento-grid">')) {
            content = content.replace('<div class="bento-grid">', '<div class="bento-grid">\n' + globalOpsHTML);
        } else if (content.includes('<div class="grid">')) {
            content = content.replace('<div class="grid">', '<div class="grid">\n' + globalOpsHTML);
        } else if (content.includes('id="mainSection"')) {
            // For HR dash
            content = content.replace(/<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-top:20px;">/i, globalOpsHTML + '\n<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-top:20px;">');
        }
    }

    // 2. Inject globalTodoJS
    if (!content.includes('loadGlobalTodos')) {
        if (content.includes('async function deleteTodo')) {
            content = content.replace(/async function deleteTodo[^{]*{[^}]*}/, '$&' + '\n' + globalTodoJS);
        } else {
            content = content.replace('</script>\n<script src="/js/nav-sync.js">', globalTodoJS + '\n</script>\n<script src="/js/nav-sync.js">');
        }
        
        // Add to init()
        if (content.includes('function init() {')) {
            content = content.replace('function init() {', 'function init() {\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
        } else if (content.includes('async function init() {')) {
            content = content.replace('async function init() {', 'async function init() {\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
        } else if (content.includes('async function init(){')) {
            content = content.replace('async function init(){', 'async function init(){\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
        }
    }

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Global Operations Throughput injected into Employee and HR dashboards.');
