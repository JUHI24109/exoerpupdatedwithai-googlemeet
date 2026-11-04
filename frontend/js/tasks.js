/**
 * EXO GLOBAL ERP — Advanced Task Management Logic
 */

const token = localStorage.getItem('token');
if (!token) window.location.href = '/';

const user = JSON.parse(localStorage.getItem('user'));
let allTasks = [];
let allUsers = [];

// Init UI
if (user) {
    document.getElementById('userPill').innerText = user.name.charAt(0);
    if (!['IT Admin', 'Chairman', 'CEO', 'Director'].includes(user.role)) {
        document.getElementById('mgmtLink').style.display = 'none';
    }
}

// ── Data Loading ──
async function loadData() {
    try {
        const [taskRes, userRes] = await Promise.all([
            fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        allTasks = await taskRes.json();
        allUsers = await userRes.json();

        renderTasks();
        populateUsers();

        // Check for deep link
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get('id');
        if (taskIdParam) {
            const task = allTasks.find(t => String(t.id) === String(taskIdParam));
            if (task) showDetails(task);
        }
    } catch (e) {
        console.error('Failed to load tasks', e);
    }
}

function renderTasks(filter = 'All') {
    const list = document.getElementById('tasksList');
    list.innerHTML = '';

    const filtered = allTasks.filter(t => filter === 'All' || t.status === filter);

    filtered.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.onclick = () => showDetails(task);

        const initials = task.Assignee ? task.Assignee.fullName.charAt(0) : '?';
        const date = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline';

        card.innerHTML = `
            <div class="priority-badge p-${task.priority}">${task.priority}</div>
            <div class="task-id">${task.taskId}</div>
            <div class="task-title">${task.title}</div>
            <div class="status-pill">${task.status}</div>
            
            <div class="task-meta">
                <div class="assignee">
                    <div class="avatar">${initials}</div>
                    <span style="font-size:12px; font-weight:600; color:var(--text-muted);">${task.Assignee ? task.Assignee.fullName.split(' ')[0] : 'Unassigned'}</span>
                </div>
                <div class="due-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${date}
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function populateUsers() {
    const select = document.getElementById('taskAssignee');
    select.innerHTML = '<option value="">Select Employee</option>';
    allUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.innerText = `${u.fullName} (${u.role})`;
        select.appendChild(opt);
    });
}

// ── Filters ──
window.filterTasks = (status) => {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.innerText.includes(status));
    });
    renderTasks(status);
};

// ── Modals & Actions ──
window.openModal = () => document.getElementById('taskModal').style.display = 'flex';
window.closeModal = () => document.getElementById('taskModal').style.display = 'none';

async function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const assignedTo = document.getElementById('taskAssignee').value;
    const priority = document.getElementById('taskPriority').value;
    const deadline = document.getElementById('taskDeadline').value;

    if (!title) return alert('Title is required');

    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, assignedTo, priority, deadline })
    });

    if (res.ok) {
        closeModal();
        loadData();
    } else {
        alert('Failed to create ticket');
    }
}

// ── Detail View Logic ──
async function updateStatus(taskId, newStatus) {
    const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
        loadData();
        return true;
    }
    return false;
}

// Simplified Detail View using Prompt/Confirm for now
window.showDetails = async (task) => {
    const msg = `
        Ticket: ${task.taskId}
        Subject: ${task.title}
        Description: ${task.description || 'N/A'}
        
        Current Status: ${task.status}
        
        Change Status to:
        1. In Progress
        2. Completed
        3. On Hold
    `;
    const choice = prompt(msg, "1");
    if (!choice) return;

    let newStatus = '';
    if (choice === "1") newStatus = 'In Progress';
    if (choice === "2") newStatus = 'Completed';
    if (choice === "3") newStatus = 'On Hold';

    if (newStatus) {
        await updateStatus(task.id, newStatus);
    }
};

loadData();
window.saveTask = saveTask;
