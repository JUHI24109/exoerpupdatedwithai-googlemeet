import re

dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Pie Chart colors
pie_pattern = re.compile(r"const pieCtx = document\.getElementById\('priorityPieChart'\)\.getContext\('2d'\);\s*const p1 = pieCtx\.createLinearGradient.*?borderWidth: 0", re.DOTALL)
new_pie = """const pieCtx = document.getElementById('priorityPieChart').getContext('2d');
    const p1 = pieCtx.createLinearGradient(0, 0, 0, 400); p1.addColorStop(0, '#1e3a8a'); p1.addColorStop(1, '#172554'); // Dark Blue
    const p2 = pieCtx.createLinearGradient(0, 0, 0, 400); p2.addColorStop(0, '#3b82f6'); p2.addColorStop(1, '#2563eb'); // Light Blue
    const p3 = pieCtx.createLinearGradient(0, 0, 0, 400); p3.addColorStop(0, '#94a3b8'); p3.addColorStop(1, '#64748b'); // Grey
    new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tickets',
                data: [
                    data.summary?.ticketsByPriority?.High || 0,
                    data.summary?.ticketsByPriority?.Medium || 0,
                    data.summary?.ticketsByPriority?.Low || 0
                ],
                backgroundColor: [p1, p2, p3],
                borderWidth: 0"""
content = pie_pattern.sub(new_pie, content)


# 2. Fix dashAddReminder Date parsing
rem_func_pattern = re.compile(r'async function dashAddReminder\(\) \{.*?\n        \}', re.DOTALL)
new_rem_func = """async function dashAddReminder() {
            const val = document.getElementById('dashRemMsg').value;
            const dateVal = document.getElementById('dashRemDate')?.value;
            
            if(!val) return;
            try {
                let reminderDT;
                if (dateVal) {
                    reminderDT = new Date(dateVal);
                } else {
                    reminderDT = new Date();
                    reminderDT.setHours(reminderDT.getHours() + 1);
                }
                
                await fetch('/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ message: val, reminderDateTime: reminderDT.toISOString(), isPublic: false })
                });
                document.getElementById('dashRemMsg').value = '';
                if(document.getElementById('dashRemDate')) document.getElementById('dashRemDate').value = '';
                loadLists();
            } catch(e) { console.error(e); }
        }"""
content = rem_func_pattern.sub(new_rem_func, content)


# 3. Add doneTodo function
if "async function doneTodo" not in content:
    content = content.replace("async function delTodo", """async function doneTodo(id) {
            try {
                await fetch(`/api/todos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ isDone: true })
                });
                loadLists();
            } catch(e) { console.error(e); }
        }

        async function delTodo""")


# 4. Update loadLists to populate Today's Operations and add Done button to To-Dos
loadLists_pattern = re.compile(r'async function loadLists\(\) \{.*?\n        \}', re.DOTALL)
new_loadLists = """async function loadLists() {
            try {
                // Fetch To-Dos
                const tdRes = await fetch('/api/todos', { headers: { Authorization: `Bearer ${token}` } });
                const todos = await tdRes.json();
                const tdHtml = todos.map(t => `<div style="padding:10px; border:1px solid #e2e8f0; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px;flex:1;">${t.title}</span>
                    <div style="display:flex;gap:10px;">
                        <i class="fa-solid fa-check" style="color:#10b981;cursor:pointer;" onclick="doneTodo(${t.id})" title="Mark as Done"></i>
                        <i class="fa-solid fa-trash" style="color:#ef4444;cursor:pointer;" onclick="delTodo(${t.id})" title="Delete"></i>
                    </div>
                </div>`).join('');
                document.getElementById('dashMyTodoList').innerHTML = todos.length ? tdHtml : '<div style="color:#94a3b8;text-align:center;padding:20px;font-size:13px;">No tasks yet. Add one above!</div>';

                // Fetch Reminders
                const remRes = await fetch('/api/reminders/my', { headers: { Authorization: `Bearer ${token}` } });
                const rems = await remRes.json();
                const remHtml = rems.map(r => {
                    const dt = new Date(r.reminderDateTime);
                    const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    return `<div style="padding:10px; border:1px solid #e2e8f0; border-radius:6px; display:flex; justify-content:space-between;align-items:center;"><div><span style="font-size:13px;">${r.message}</span><span style="font-size:11px;color:#64748b;margin-left:8px;">📅 ${dateStr} ⏰ ${timeStr}</span></div><i class="fa-solid fa-check" style="color:#10b981;cursor:pointer;" onclick="doneRem(${r.id})" title="Mark Completed"></i></div>`;
                }).join('');
                document.getElementById('dashRemindersList').innerHTML = rems.length ? remHtml : '<div style="color:#94a3b8;text-align:center;padding:20px;font-size:13px;">No reminders.</div>';

                // Today's Operations: Reminders
                const today = new Date().toDateString();
                const todayRems = rems.filter(r => new Date(r.reminderDateTime).toDateString() === today);
                document.getElementById('opsReminders').innerHTML = todayRems.length ? todayRems.map(r => `<div style="margin-bottom:4px;">&bull; ${r.message} (${new Date(r.reminderDateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</div>`).join('') : '<div style="font-size:11px;color:var(--text-light);">No reminders today</div>';

                // Today's Operations: Active Tickets
                const tRes = await fetch('/api/tickets/my-tickets', { headers: { Authorization: `Bearer ${token}` } });
                const tData = await tRes.json();
                const active = tData.filter(t => t.status !== 'Completed' && t.status !== 'Rejected').slice(0, 3);
                document.getElementById('opsTickets').innerHTML = active.length ? active.map(t => `<div style="margin-bottom:4px;">&bull; [${t.ticketId}] ${t.title}</div>`).join('') : '<div style="font-size:11px;color:var(--text-light);">No active tickets</div>';

                // Today's Operations: Messages
                const mRes = await fetch('/api/chat/history', { headers: { Authorization: `Bearer ${token}` } });
                const mData = await mRes.json();
                const msgs = mData.slice(0, 2);
                document.getElementById('opsChat').innerHTML = msgs.length ? msgs.map(m => `<div style="margin-bottom:4px;">&bull; <b>${m.senderId}:</b> ${m.content}</div>`).join('') : '<div style="font-size:11px;color:var(--text-light);">No new messages</div>';

            } catch(e) {
                console.error('Failed to load lists:', e);
            }
        }"""
content = loadLists_pattern.sub(new_loadLists, content)

# 5. Make sure doneRem is defined
if "async function doneRem" not in content:
    content = content.replace("async function delRem", """async function doneRem(id) {
            try {
                await fetch(`/api/reminders/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ isCompleted: true })
                });
                loadLists();
            } catch(e) { console.error(e); }
        }

        async function delRem""")


with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard operations fixed!')
