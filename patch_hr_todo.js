const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const dashFiles = ['dashboard.html', 'dashboard-ceo.html', 'dashboard-chairman.html', 'dashboard-employee.html', 'dashboard-hr.html'];

const todoSectionHTML = `
<!-- ═══ MY TO-DO SECTION ═══ -->
<section id="todoSection" style="display:none;flex-direction:column;flex:1;padding:20px;gap:14px;overflow-y:auto;background:var(--bg);">
    <div class="card" style="flex:1;">
        <div class="card-header" style="font-size:18px; color:var(--primary);"><i class="fa-solid fa-list-check"></i> My To-Do List</div>
        <div class="card-body" style="padding:20px;">
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="tdTitle" class="input" placeholder="Task description..." style="flex:1;">
                <input type="month" id="tdMonth" class="input" title="Monthly Reminder Date">
                <button class="btn" style="background:var(--primary); color:white;" onclick="saveTodo()"><i class="fa-solid fa-plus"></i> Add To-Do</button>
            </div>
            <div id="todoContainer" style="display:flex; flex-direction:column; gap:10px;">
                <div style="color:var(--text-light); text-align:center;">Loading...</div>
            </div>
        </div>
    </div>
</section>
`;

const widgetHTML = `
            <!-- Personal To-Do Widget -->
            <div class="card c-todo-widget" style="grid-column: span 12; margin-top: 20px;">
                <div class="card-header" style="background:var(--surface); color:var(--text-main); display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-clipboard-check" style="color:var(--primary);"></i> My Quick To-Do List</span>
                    <button class="btn" style="font-size:11px; padding:4px 8px; background:var(--primary-light); color:var(--primary);" onclick="showSection('todo')">Manage All</button>
                </div>
                <div class="card-body" style="padding:10px;" id="dashTodoWidget">
                    <div style="text-align:center; padding:15px; color:var(--text-light);">Loading quick tasks...</div>
                </div>
            </div>
`;

dashFiles.forEach(file => {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');

    // 1. If it's HR dashboard, it missed the previous patch, so add nav link and section
    if (file === 'dashboard-hr.html') {
        if (!content.includes('nav-todo')) {
            content = content.replace(
                /<a href="profile.html" class="nav-link/i,
                `<a href="#" class="nav-link" id="nav-todo" onclick="showSection('todo')"><i class="fa-solid fa-list-check"></i> My To-Do</a>\n        <a href="profile.html" class="nav-link`
            );
        }
        if (!content.includes('id="todoSection"')) {
            content = content.replace('</main>', todoSectionHTML + '\n</main>');
        }
        
        // Add the JS if missing
        if (!content.includes('loadMyTodos')) {
            const myTodoJS = `
async function loadMyTodos() {
    try {
        const res = await fetch('/api/todos', { headers: { Authorization: \`Bearer \${token}\` } });
        const todos = await res.json();
        const cont = document.getElementById('todoContainer');
        const dashWidget = document.getElementById('dashTodoWidget');
        
        if(cont) {
            cont.innerHTML = '';
            if (!todos.length) cont.innerHTML = '<div style="color:var(--text-light); text-align:center; padding:20px;">No to-dos yet.</div>';
            todos.forEach(t => {
                cont.innerHTML += \`
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid var(--border); border-radius:4px; background:var(--surface);">
                        <div>
                            <div style="font-weight:600; font-size:14px; \${t.isDeleted ? 'text-decoration:line-through;color:var(--text-light);' : 'color:var(--text-main);'}">\${t.title}</div>
                            \${t.reminderMonth ? \`<div style="font-size:11px; color:var(--accent); margin-top:4px;"><i class="fa-solid fa-calendar"></i> Reminder: \${t.reminderMonth}</div>\` : ''}
                        </div>
                        <button class="btn" style="background:var(--success); color:white; padding:6px 12px;" onclick="deleteTodo(\${t.id})"><i class="fa-solid fa-check"></i> Done</button>
                    </div>\`;
            });
        }
        
        if(dashWidget) {
            dashWidget.innerHTML = '';
            const active = todos.filter(t => !t.isDeleted);
            if (!active.length) dashWidget.innerHTML = '<div style="color:var(--text-light); text-align:center; padding:15px; font-size:12px;">All caught up! No pending to-dos.</div>';
            active.forEach(t => {
                dashWidget.innerHTML += \`
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); margin-bottom:8px; padding:10px; border-radius:4px; cursor:pointer;" onclick="deleteTodo(\${t.id})">
                        <div>
                            <div style="font-weight:600; font-size:13px; color:var(--text-main);">\${t.title}</div>
                            \${t.reminderMonth ? \`<div style="font-size:10px; color:var(--text-light);">Reminder: \${t.reminderMonth}</div>\` : ''}
                        </div>
                        <div style="color:var(--text-light); font-size:18px;"><i class="fa-regular fa-circle"></i></div>
                    </div>\`;
            });
        }
    } catch(e) { console.error(e); }
}

async function saveTodo() {
    const title = document.getElementById('tdTitle').value;
    const month = document.getElementById('tdMonth').value;
    if(!title) return alert('Task description required');
    try {
        await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` }, body: JSON.stringify({ title, reminderMonth: month || null }) });
        if(document.getElementById('tdTitle')) document.getElementById('tdTitle').value = '';
        if(document.getElementById('tdMonth')) document.getElementById('tdMonth').value = '';
        loadMyTodos();
        if(typeof loadGlobalTodos === 'function') loadGlobalTodos();
    } catch(e) { console.error(e); }
}

async function deleteTodo(id) {
    try {
        await fetch(\`/api/todos/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
        loadMyTodos();
        if(typeof loadGlobalTodos === 'function') loadGlobalTodos();
    } catch(e) { console.error(e); }
}
`;
            content = content.replace('initDashboard();', myTodoJS + '\ninitDashboard();\nloadMyTodos();');
            content = content.replace('document.getElementById(\'attendanceSection\').style.display = name===\'attendance\'?\'flex\':\'none\';', 'document.getElementById(\'attendanceSection\').style.display = name===\'attendance\'?\'flex\':\'none\';\n    if(document.getElementById(\'todoSection\')) document.getElementById(\'todoSection\').style.display = name===\'todo\'?\'flex\':\'none\';');
            content = content.replace('if(name===\'empdata\')', 'if(name===\'todo\'){document.getElementById(\'nav-todo\').classList.add(\'active\'); document.getElementById(\'headerTitle\').innerText=\'My To-Do List\'; loadMyTodos();}\n    if(name===\'empdata\')');
        }
    } else {
        // For other dashboards, update the loadMyTodos to include the widget logic and change Delete to Done
        if (content.includes('loadMyTodos')) {
            content = content.replace(/<button class="btn" style="background:var\(--danger\); color:white; padding:6px 12px;" onclick="deleteTodo\(\$\{t.id\}\)"><i class="fa-solid fa-trash"><\/i> Delete<\/button>/g, 
            '<button class="btn" style="background:var(--success); color:white; padding:6px 12px;" onclick="deleteTodo(${t.id})"><i class="fa-solid fa-check"></i> Done</button>');
            
            // We need to inject the widget logic into loadMyTodos
            if (!content.includes('dashWidget.innerHTML')) {
                const widgetLogic = `
        const dashWidget = document.getElementById('dashTodoWidget');
        if(dashWidget) {
            dashWidget.innerHTML = '';
            const active = todos.filter(t => !t.isDeleted);
            if (!active.length) dashWidget.innerHTML = '<div style="color:var(--text-light); text-align:center; padding:15px; font-size:12px;">All caught up! No pending to-dos.</div>';
            active.forEach(t => {
                dashWidget.innerHTML += \`
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); margin-bottom:8px; padding:10px; border-radius:4px; cursor:pointer;" onclick="deleteTodo(\${t.id})">
                        <div>
                            <div style="font-weight:600; font-size:13px; color:var(--text-main);">\${t.title}</div>
                            \${t.reminderMonth ? \`<div style="font-size:10px; color:var(--text-light);">Reminder: \${t.reminderMonth}</div>\` : ''}
                        </div>
                        <div style="color:var(--text-light); font-size:18px;"><i class="fa-regular fa-circle-check"></i></div>
                    </div>\`;
            });
        }
`;
                content = content.replace('} catch(e) { console.error(e); }', widgetLogic + '} catch(e) { console.error(e); }');
            }

            // Remove confirmation from deleteTodo so it's a quick click
            content = content.replace("if(!confirm('Delete this to-do?')) return;", "");
            
            // Add loadMyTodos() to init() so the widget populates on load
            if (content.includes('function init() {') && !content.includes('loadMyTodos();')) {
                content = content.replace('function init() {', 'function init() {\n        if(typeof loadMyTodos === "function") loadMyTodos();');
            } else if (content.includes('async function init() {') && !content.includes('loadMyTodos();')) {
                content = content.replace('async function init() {', 'async function init() {\n        if(typeof loadMyTodos === "function") loadMyTodos();');
            } else if (content.includes('async function init(){') && !content.includes('loadMyTodos();')) {
                content = content.replace('async function init(){', 'async function init(){\n        if(typeof loadMyTodos === "function") loadMyTodos();');
            }
        }
    }

    // Finally, inject the widgetHTML into the main dashboard section (bento-grid or dashboard)
    if (!content.includes('dashTodoWidget')) {
        // Place it at the top of the bento-grid or right after the quick actions
        if (content.includes('<div class="bento-grid">')) {
            content = content.replace('<div class="bento-grid">', '<div class="bento-grid">\n' + widgetHTML);
        } else if (content.includes('<div class="grid">')) {
            content = content.replace('<div class="grid">', '<div class="grid">\n' + widgetHTML);
        } else if (content.includes('id="mainSection"')) {
            content = content.replace(/<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">/i, widgetHTML + '\n<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-top:20px;">');
            if (file === 'dashboard-hr.html') {
                // Since HR dashboard doesn't have a bento grid, just put it above the charts
                content = content.replace(/<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">/i, widgetHTML + '\n<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-top:20px;">');
            }
        }
    }

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('To-Do widgets added and HR dashboard updated.');
