const token = localStorage.getItem('token');
if (!token) window.location.href = '/';
const user = JSON.parse(localStorage.getItem('user') || '{}');

function populateHeader() {
    const displayName = user.name || user.fullName || user.employeeId || 'User';
    const displayRole = user.role || 'Employee';
    const displayInitial = displayName.charAt(0).toUpperCase();

    const nameEl = document.getElementById('uName');
    const roleEl = document.getElementById('uRole');
    const avEl = document.getElementById('uAv');

    if (nameEl) nameEl.innerText = displayName;
    if (roleEl) roleEl.innerText = displayRole;
    if (avEl) avEl.innerText = displayInitial;
}
populateHeader();

document.addEventListener('DOMContentLoaded', async () => {
    populateHeader();

    // Load badge counts
    

    // Load all data with proper error handling
    try { loadTodos(); } catch (e) { console.error('Todo load error', e); }
    try { loadReminders(); } catch (e) { console.error('Reminder load error', e); }
    try { loadTickets(); } catch (e) { console.error('Ticket load error', e); }
    try { loadDocuments(); } catch (e) { console.error('Document load error', e); }
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.currentTarget.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function getEmptyStateHtml(title, desc, icon = 'fa-folder-open') {
    return `
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-desc">${desc}</div>
        </div>
    `;
}

async function loadTodos() {
    try {
        const res = await fetch('/api/todos/history', { headers: { Authorization: `Bearer ${token}` } });
        const todos = await res.json();
        const container = document.getElementById('todosList');
        const badge = document.getElementById('count-todos');
        
        container.innerHTML = '';
        const count = Array.isArray(todos) ? todos.length : 0;
        if (badge) badge.innerText = count;
        
        if (!todos || count === 0) {
            container.innerHTML = getEmptyStateHtml('No Completed To-Dos', 'Any to-dos you complete will be archived here for reference.', 'fa-clipboard-check');
            return;
        }

        todos.forEach(t => {
            container.innerHTML += `
                <div class="history-item">
                    <div style="display:flex; align-items:center;">
                        <div class="history-icon" style="background:rgba(16, 185, 129, 0.1); color:var(--success);"><i class="fa-solid fa-check"></i></div>
                        <div class="item-info">
                            <div class="item-title">${t.title}</div>
                            <div class="item-meta"><i class="fa-regular fa-clock"></i> Completed on: ${new Date(t.updatedAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="item-status status-done">Completed</div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        document.getElementById('todosList').innerHTML = '<div style="color:red; padding:20px;">Failed to load to-dos.</div>';
    }
}

async function loadReminders() {
    try {
        const res = await fetch('/api/reminders/history', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Reminders fetch failed: ${res.status} ${err}`);
        }
        const reminders = await res.json();
        const container = document.getElementById('remindersList');
        const badge = document.getElementById('count-reminders');
        
        container.innerHTML = '';
        const count = Array.isArray(reminders) ? reminders.length : 0;
        if (badge) badge.innerText = count;
        
        if (!reminders || count === 0) {
            container.innerHTML = getEmptyStateHtml('No Dismissed Reminders', 'Archived reminders that you dismissed will show up in this tab.', 'fa-bell-slash');
            return;
        }

        reminders.forEach(r => {
            container.innerHTML += `
                <div class="history-item">
                    <div style="display:flex; align-items:center;">
                        <div class="history-icon" style="background:rgba(245, 158, 11, 0.1); color:var(--warning);"><i class="fa-solid fa-bell-slash"></i></div>
                        <div class="item-info">
                            <div class="item-title">${r.message}</div>
                            <div class="item-meta"><i class="fa-regular fa-clock"></i> Dismissed on: ${new Date(r.updatedAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="item-status status-done">Completed</div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        document.getElementById('remindersList').innerHTML = '<div style="color:red; padding:20px;">Failed to load reminders.</div>';
    }
}

async function loadTickets() {
    try {
        const res = await fetch('/api/tickets/my-tickets?deleted=true', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Tickets fetch failed: ${res.status} ${err}`);
        }
        const tickets = await res.json();
        const container = document.getElementById('ticketsList');
        const badge = document.getElementById('count-tickets');
        
        container.innerHTML = '';
        
        const isExecutive = ['IT Admin', 'Chairman', 'CEO'].includes(user.role);
        if (!isExecutive) {
            if (badge) badge.innerText = '0';
            container.innerHTML = getEmptyStateHtml('Access Restricted', 'Only executive staff members (CEO, Chairman, and IT Admin) can view deleted tickets.', 'fa-shield-halved');
            return;
        }

        const count = Array.isArray(tickets) ? tickets.length : 0;
        if (badge) badge.innerText = count;

        if (!tickets || count === 0) {
            container.innerHTML = getEmptyStateHtml('No Deleted Tickets', 'Great! No tickets have been deleted in the system.', 'fa-ticket');
            return;
        }

        tickets.forEach(t => {
            container.innerHTML += `
                <div class="history-item">
                    <div style="display:flex; align-items:center;">
                        <div class="history-icon" style="background:rgba(239, 68, 68, 0.1); color:var(--danger);"><i class="fa-solid fa-trash-can"></i></div>
                        <div class="item-info">
                            <div class="item-title">${t.ticketId}: ${t.title}</div>
                            <div class="item-meta"><i class="fa-regular fa-clock"></i> Deleted on: ${new Date(t.updatedAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="item-status status-deleted">Deleted</div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        document.getElementById('ticketsList').innerHTML = '<div style="color:red; padding:20px;">Failed to load tickets.</div>';
    }
}

async function loadDocuments() {
    try {
        // Fix: Use correct endpoint path /api/employee-documents instead of /api/documents
        const res = await fetch('/api/employee-documents?deleted=true', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 404 || !res.ok) {
            const err = await res.text();
            throw new Error(`Documents fetch failed: ${res.status} ${err}`);
        }
        const container = document.getElementById('documentsList');
        const badge = document.getElementById('count-documents');
        
        container.innerHTML = '';
        
        const docs = await res.json();
        const count = Array.isArray(docs) ? docs.length : 0;
        if (badge) badge.innerText = count;
        
        if (!docs || count === 0) {
            container.innerHTML = getEmptyStateHtml('No Deleted Documents', 'No deleted documents were found in your repository.', 'fa-file-excel');
            return;
        }

        docs.forEach(d => {
            container.innerHTML += `
                <div class="history-item">
                    <div style="display:flex; align-items:center;">
                        <div class="history-icon" style="background:rgba(239, 68, 68, 0.1); color:var(--danger);"><i class="fa-solid fa-file-invoice"></i></div>
                        <div class="item-info">
                            <div class="item-title">${d.docTitle || d.fileName}</div>
                            <div class="item-meta"><i class="fa-regular fa-clock"></i> Deleted on: ${new Date(d.updatedAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="item-status status-deleted">Deleted</div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        document.getElementById('documentsList').innerHTML = '<div style="color:red; padding:20px;">Failed to load documents.</div>';
    }
}
