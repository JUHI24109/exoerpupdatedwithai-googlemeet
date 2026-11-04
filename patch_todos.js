const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const dashFiles = ['dashboard.html', 'dashboard-ceo.html', 'dashboard-chairman.html', 'dashboard-employee.html'];

const powerBITheme = {
    '--bg': '#f3f2f1',
    '--surface': '#ffffff',
    '--border': '#edeef2',
    '--border-soft': '#f3f4f6',
    '--text-main': '#242526',
    '--text-light': '#605e5c',
    '--primary': '#000080',  // Navy Blue
    '--primary-dark': '#000040',
    '--accent': '#005a9e',
    '--success': '#107c41',
    '--danger': '#d13438',
    '--warning': '#ffb900'
};

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
                <tr>
                    <td><div style="font-weight:600;">\${empName}</div><div style="font-size:10px;color:var(--text-light);">\${role}</div></td>
                    <td style="\${isDone ? 'text-decoration:line-through;color:var(--text-light);' : ''}">\${t.title}</td>
                    <td><span class="badge" style="background:#eef2ff;color:#4f46e5;">\${t.reminderMonth || 'None'}</span></td>
                    <td>\${isDone ? '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Done</span>' : '<span style="color:var(--warning);"><i class="fa-solid fa-clock"></i> Pending</span>'}</td>
                </tr>
            \`;
        });
    } catch(e) { console.error('Global Todo Error:', e); }
}
`;

const myTodoJS = `
async function loadMyTodos() {
    try {
        const res = await fetch('/api/todos', { headers: { Authorization: \`Bearer \${token}\` } });
        const todos = await res.json();
        const cont = document.getElementById('todoContainer');
        if(!cont) return;
        cont.innerHTML = '';
        if (!todos.length) {
            cont.innerHTML = '<div style="color:var(--text-light); text-align:center; padding:20px;">No to-dos yet.</div>';
            return;
        }
        todos.forEach(t => {
            cont.innerHTML += \`
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid var(--border); border-radius:4px; background:var(--surface);">
                    <div>
                        <div style="font-weight:600; font-size:14px; \${t.isDeleted ? 'text-decoration:line-through;color:var(--text-light);' : 'color:var(--text-main);'}">\${t.title}</div>
                        \${t.reminderMonth ? \`<div style="font-size:11px; color:var(--accent); margin-top:4px;"><i class="fa-solid fa-calendar"></i> Reminder: \${t.reminderMonth}</div>\` : ''}
                    </div>
                    <button class="btn" style="background:var(--danger); color:white; padding:6px 12px;" onclick="deleteTodo(\${t.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            \`;
        });
    } catch(e) { console.error(e); }
}

async function saveTodo() {
    const title = document.getElementById('tdTitle').value;
    const month = document.getElementById('tdMonth').value;
    if(!title) return alert('Task description required');
    try {
        await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify({ title, reminderMonth: month || null })
        });
        document.getElementById('tdTitle').value = '';
        document.getElementById('tdMonth').value = '';
        loadMyTodos();
        if(typeof loadGlobalTodos === 'function') loadGlobalTodos();
    } catch(e) { console.error(e); }
}

async function deleteTodo(id) {
    if(!confirm('Delete this to-do?')) return;
    try {
        await fetch(\`/api/todos/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
        loadMyTodos();
        if(typeof loadGlobalTodos === 'function') loadGlobalTodos();
    } catch(e) { console.error(e); }
}

// Intercept showSection to load todos
const oldShowSection = window.showSection || function(){};
window.showSection = function(name) {
    // Hide all main sections
    const ids = ['mainSection', 'leavesSection', 'attendanceSection', 'assetsSection', 'empdataSection', 'todoSection'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.style.display = 'none';
        }
    });

    // We do a soft switch for dashboard vs others if mainSection doesn't exist
    if(name === 'main') {
        if(document.getElementById('mainSection')) document.getElementById('mainSection').style.display = 'flex';
        else if(document.querySelector('.dashboard') && document.querySelector('.dashboard').id !== 'mainSection') document.querySelector('.dashboard').style.display = 'flex';
    } else {
        const target = document.getElementById(name + 'Section');
        if(target) target.style.display = 'flex';
        // hide the main unnamed dashboard if necessary
        if(document.querySelector('.dashboard') && !document.querySelector('.dashboard').id) {
            document.querySelector('.dashboard').style.display = 'none';
        }
    }

    // Active nav states
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    if(name === 'main') {
        const m = document.querySelector('a[href*="dashboard"]');
        if(m) m.classList.add('active');
    } else {
        const it = document.getElementById('nav-' + name);
        if(it) it.classList.add('active');
    }

    if(name === 'todo') loadMyTodos();
    
    // Call old showSection if it exists and handles other things
    try { oldShowSection(name); } catch(e) {}
};
`;

const globalOpsHTML = `
            <!-- Operations Throughput (Global To-Dos) -->
            <div class="card" style="grid-column: span 12; margin-top: 20px;">
                <div class="card-header" style="background:var(--primary); color:white; font-size:16px;">
                    <i class="fa-solid fa-gears"></i> Operations Throughput (Company To-Dos & Reminders)
                </div>
                <div class="card-body" style="padding:0;">
                    <table>
                        <thead><tr><th style="padding-left:20px;">Employee</th><th>To-Do Task</th><th>Monthly Reminder</th><th>Status</th></tr></thead>
                        <tbody id="globalTodoTable"><tr><td colspan="4" style="text-align:center; padding:20px;">Loading operations...</td></tr></tbody>
                    </table>
                </div>
            </div>
`;

dashFiles.forEach(file => {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Theme application (variables)
    for (const [key, val] of Object.entries(powerBITheme)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // Border radius fix for cards and buttons
    content = content.replace(/border-radius:\s*12px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*10px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*8px/g, 'border-radius: 4px');
    content = content.replace(/border-radius:\s*14px/g, 'border-radius: 6px'); // for modal
    
    // 2. Add To-Do Nav Link
    if (!content.includes('nav-todo')) {
        content = content.replace(
            /<a href="profile.html" class="nav-item/i,
            `<a href="#" class="nav-item" id="nav-todo" onclick="showSection('todo')"><i class="fa-solid fa-list-check"></i> My To-Do</a>\n        <a href="profile.html" class="nav-item`
        );
    }

    // 3. Add To-Do Section HTML
    if (!content.includes('id="todoSection"')) {
        content = content.replace('</main>', todoSectionHTML + '\n</main>');
    }

    // 4. Add Operations Throughput to Admins (CEO, Chairman, IT)
    if (['dashboard-ceo.html', 'dashboard-chairman.html', 'dashboard.html'].includes(file)) {
        if (!content.includes('Operations Throughput')) {
            // Find the end of bento-grid or dashboard
            if (content.includes('</div>\n    </div>\n\n    </main>')) {
                content = content.replace('</div>\n    </div>\n\n    </main>', globalOpsHTML + '\n        </div>\n    </div>\n\n    </main>');
            } else if (content.includes('</div>\n    </div>\n</main>')) {
                 content = content.replace('</div>\n    </div>\n</main>', globalOpsHTML + '\n        </div>\n    </div>\n</main>');
            } else if (content.includes('</div>\n        </div>\n    </div>\n</main>')) { // Sometimes nested differently
                content = content.replace('</div>\n        </div>\n    </div>\n</main>', globalOpsHTML + '\n        </div>\n        </div>\n    </div>\n</main>');
            } else if (content.includes('</div>\n        </div>\n    </main>')) {
                content = content.replace('</div>\n        </div>\n    </main>', globalOpsHTML + '\n</div>\n        </div>\n    </main>');
            }
        }
    }

    // 5. Inject JS
    if (!content.includes('loadMyTodos')) {
        const scriptInjections = myTodoJS + (['dashboard-ceo.html', 'dashboard-chairman.html', 'dashboard.html'].includes(file) ? globalTodoJS : '');
        content = content.replace('</script>\n<script src="/js/nav-sync.js"></script>', scriptInjections + '\n</script>\n<script src="/js/nav-sync.js"></script>');
        content = content.replace('</script>\n</body>', scriptInjections + '\n</script>\n</body>');
        
        if (['dashboard-ceo.html', 'dashboard-chairman.html', 'dashboard.html'].includes(file)) {
            // Add init call to loadGlobalTodos
            content = content.replace('function init() {', 'function init() {\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
            content = content.replace('async function init() {', 'async function init() {\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
            content = content.replace('async function init(){', 'async function init(){\n        if(typeof loadGlobalTodos === "function") loadGlobalTodos();');
        }
    }

    // Fix button classes specifically for CEO/Chairman sidebars if they had inline styles
    content = content.replace(/background:\s*#0a192f/g, 'background: var(--primary)');
    content = content.replace(/background:\s*#3e2723/g, 'background: var(--primary)');
    
    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Dashboards upgraded successfully!');
