const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend');

const files = [
    'dashboard-employee.html',
    'dashboard-ceo.html',
    'dashboard-chairman.html',
    'dashboard.html'
];

const widgetHTML = `
        <!-- My To-Do + Operations Activity Throughput -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;">
            <!-- MY TO-DO QUICK ADD -->
            <div class="card" style="display:flex;flex-direction:column;gap:10px;padding:20px;min-height:320px;">
                <div style="font-size:15px;font-weight:700;color:var(--primary);padding-bottom:10px;border-bottom:2px solid var(--border);">
                    <i class="fa-solid fa-list-check"></i> My To-Do List
                </div>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="dashTdTitle" placeholder="Add a task..." style="flex:1;padding:8px 12px;font-size:13px;border:1px solid var(--border);border-radius:4px;outline:none;">
                    <input type="month" id="dashTdMonth" title="Monthly Reminder" style="width:140px;padding:8px;font-size:13px;border:1px solid var(--border);border-radius:4px;outline:none;">
                    <button onclick="dashAddTodo()" style="background:var(--primary);color:white;border:none;border-radius:4px;padding:8px 14px;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap;">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                </div>
                <div id="dashMyTodoList" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;max-height:220px;">
                    <div style="color:var(--text-light);text-align:center;padding:20px;font-size:13px;">Loading your tasks...</div>
                </div>
            </div>

            <!-- OPERATIONS ACTIVITY THROUGHPUT -->
            <div class="card" style="display:flex;flex-direction:column;padding:20px;min-height:320px;">
                <div style="font-size:15px;font-weight:700;color:var(--primary);padding-bottom:10px;border-bottom:2px solid var(--border);margin-bottom:10px;">
                    <i class="fa-solid fa-gears"></i> Operations Activity Throughput
                </div>
                <div style="overflow-y:auto;flex:1;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);">Employee</th>
                                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);">Task</th>
                                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);">Reminder</th>
                                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);">Status</th>
                            </tr>
                        </thead>
                        <tbody id="dashGlobalTodoTable">
                            <tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-light);">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

const todoJS = `
// ── DASHBOARD TODO WIDGET ──
async function dashLoadMyTodos() {
    const list = document.getElementById('dashMyTodoList');
    if (!list) return;
    try {
        const res = await fetch('/api/todos', { headers: { Authorization: \`Bearer \${token}\` } });
        const todos = await res.json();
        list.innerHTML = '';
        const active = Array.isArray(todos) ? todos.filter(t => !t.isDeleted) : [];
        if (!active.length) {
            list.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:20px;font-size:13px;">No tasks yet. Add one above!</div>';
            return;
        }
        active.forEach(t => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid var(--border);border-radius:4px;';
            item.innerHTML = \`
                <div>
                    <div style="font-weight:600;font-size:13px;color:var(--text-main);">\${t.title}</div>
                    \${t.reminderMonth ? \`<div style="font-size:11px;color:#4f46e5;margin-top:2px;"><i class="fa-solid fa-calendar-days"></i> \${t.reminderMonth}</div>\` : ''}
                </div>
                <button onclick="dashDoneTodo(\${t.id})" style="background:#16a34a;color:white;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;flex-shrink:0;">
                    <i class="fa-solid fa-check"></i> Done
                </button>\`;
            list.appendChild(item);
        });
    } catch(e) { console.error('dashLoadMyTodos error:', e); }
}

async function dashAddTodo() {
    const titleEl = document.getElementById('dashTdTitle');
    const monthEl = document.getElementById('dashTdMonth');
    const title = titleEl ? titleEl.value.trim() : '';
    const month = monthEl ? monthEl.value : '';
    if (!title) { alert('Please enter a task description'); return; }
    try {
        await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify({ title, reminderMonth: month || null })
        });
        if (titleEl) titleEl.value = '';
        if (monthEl) monthEl.value = '';
        await dashLoadMyTodos();
        await dashLoadGlobalTodos();
    } catch(e) { console.error('dashAddTodo error:', e); }
}

async function dashDoneTodo(id) {
    try {
        await fetch(\`/api/todos/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
        await dashLoadMyTodos();
        await dashLoadGlobalTodos();
    } catch(e) { console.error('dashDoneTodo error:', e); }
}

async function dashLoadGlobalTodos() {
    const tbody = document.getElementById('dashGlobalTodoTable');
    if (!tbody) return;
    try {
        const res = await fetch('/api/todos/all', { headers: { Authorization: \`Bearer \${token}\` } });
        const todos = await res.json();
        tbody.innerHTML = '';
        if (!Array.isArray(todos) || !todos.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">No tasks in pipeline yet</td></tr>';
            return;
        }
        todos.forEach(t => {
            const name = t.User ? t.User.fullName : 'Unknown';
            const role = t.User ? t.User.role : '';
            const done = t.isDeleted;
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            tr.innerHTML = \`
                <td style="padding:10px 12px;">
                    <div style="font-weight:600;font-size:13px;">\${name}</div>
                    <div style="font-size:10px;color:var(--text-light);">\${role}</div>
                </td>
                <td style="padding:10px 12px;font-size:13px;\${done ? 'text-decoration:line-through;color:var(--text-light);' : ''}">\${t.title}</td>
                <td style="padding:10px 12px;">
                    <span style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#eef2ff;color:#4f46e5;">\${t.reminderMonth || '—'}</span>
                </td>
                <td style="padding:10px 12px;">
                    \${done
                        ? '<span style="color:#16a34a;font-weight:700;font-size:12px;"><i class="fa-solid fa-check-circle"></i> Done</span>'
                        : '<span style="color:#d97706;font-weight:700;font-size:12px;"><i class="fa-solid fa-clock"></i> Pending</span>'
                    }
                </td>\`;
            tbody.appendChild(tr);
        });
    } catch(e) { console.error('dashLoadGlobalTodos error:', e); }
}
`;

files.forEach(file => {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) { console.log('SKIP (not found):', file); return; }
    let content = fs.readFileSync(fp, 'utf8');

    // STEP 1: Inject widget HTML if not already present
    if (!content.includes('id="dashGlobalTodoTable"')) {
        // For employee dashboard: inject right before </div> that closes .dashboard div
        // Try multiple anchor points
        const anchors = [
            // After the grid / bento grid closing
            ['</div>\n</main>', widgetHTML + '\n</div>\n</main>'],
            ['</div>\n\n</main>', widgetHTML + '\n</div>\n\n</main>'],
            ['</div>\r\n</main>', widgetHTML + '\n</div>\r\n</main>'],
            // Inside .dashboard before it closes  
            ['</div>\n\n    </main>', widgetHTML + '\n</div>\n\n    </main>'],
        ];

        let injected = false;
        // Best approach: find the closing of the main dashboard section
        // For employee: .dashboard div closes before </main>
        if (file === 'dashboard-employee.html') {
            // Find the grid section and append after it
            content = content.replace(
                /(<\/section>\s*<\/div>\s*<\/main>)/,
                widgetHTML + '\n$1'
            );
            injected = true;
        } else if (file === 'dashboard-ceo.html' || file === 'dashboard-chairman.html' || file === 'dashboard.html') {
            // These have bento-grid. Append widget after bento-grid closing
            content = content.replace(
                /(<\/div>\s*<\/div>\s*\n\s*<\/main>)/,
                widgetHTML + '\n$1'
            );
            injected = true;
        }

        if (!injected) {
            // Fallback: inject before </main>
            content = content.replace('</main>', widgetHTML + '\n</main>');
        }
    }

    // STEP 2: Inject JS functions if not present
    if (!content.includes('dashLoadMyTodos')) {
        // Inject before </script> (last one before </body>)
        const lastScriptClose = content.lastIndexOf('</script>');
        if (lastScriptClose !== -1) {
            content = content.slice(0, lastScriptClose) + todoJS + '\ndashLoadMyTodos();\ndashLoadGlobalTodos();\n' + content.slice(lastScriptClose);
        }
    }

    fs.writeFileSync(fp, content, 'utf8');
    console.log('Updated:', file);
});

console.log('\nAll dashboards updated!');
