const fs = require('fs');
const html = fs.readFileSync('frontend/employees.html', 'utf8');
const idx = html.indexOf('<script>');
const htmlPart = html.substring(0, idx);

const scriptPart = `<script>
const token = localStorage.getItem('token');
if (!token) window.location.href = '/';
let allUsers = [], isEditMode = false, currentEditId = null;
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

window.addEventListener('DOMContentLoaded', () => {
    if (currentUser.role !== 'IT Admin') {
        const b = document.querySelector('button[onclick="showModal()"]');
        if (b) b.style.display = 'none';
    }
});

async function loadUsers() {
    try {
        const r = await fetch('/api/auth/users', { headers: { Authorization: \`Bearer \${token}\` } });
        allUsers = await r.json();
        renderTable();
        const p = new URLSearchParams(window.location.search);
        const e = p.get('edit');
        if (e) { const u = allUsers.find(x => x.employeeId === e); if (u) prepareEdit(e); }
    } catch (e) { console.error(e); }
}

function renderTable() {
    const b = document.getElementById('empTable');
    const q = document.getElementById('searchEmp').value.toLowerCase();
    b.innerHTML = '';
    allUsers.forEach(u => {
        if (!u.fullName.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q)) return;
        const tr = document.createElement('tr');
        tr.innerHTML = \`
            <td style="font-weight:800;color:var(--accent);cursor:pointer" onclick="impersonate('\${u.employeeId}')">\${u.employeeId}</td>
            <td style="font-weight:600">\${u.fullName}</td>
            <td style="color:#64748b">\${u.email}</td>
            <td><span style="font-weight:700">\${u.role}</span></td>
            <td>\${u.department || '\\u2014'}</td>
            <td style="text-align:right;white-space:nowrap">
                <button class="btn-primary" style="padding:4px 8px;font-size:12px;margin-right:5px" onclick="prepareEdit('\${u.employeeId}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-primary" style="padding:4px 8px;font-size:12px;background:#e11d48" onclick="deleteUser('\${u.employeeId}','\${u.fullName}')"><i class="fa-solid fa-trash"></i></button>
            </td>\`;
        b.appendChild(tr);
    });
}

async function deleteUser(eid, name) {
    if (!confirm('Delete ' + name + ' (' + eid + ')?')) return;
    try {
        const r = await fetch(\`/api/auth/user/\${eid}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
        if (r.ok) { alert('Deleted'); location.reload(); } else alert('Failed');
    } catch (e) { alert('Error'); }
}

async function impersonate(eid) {
    if (!confirm('Switch to ' + eid + '?')) return;
    try {
        const r = await fetch(\`/api/auth/impersonate/\${eid}\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
        const d = await r.json();
        if (r.ok) { localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); window.location.href = '/dashboard.html'; }
        else alert(d.error);
    } catch (e) { alert('Failed'); }
}

function showModal(isEdit = false) {
    isEditMode = isEdit;
    document.getElementById('modalTitle').innerText = isEdit ? 'Update Employee' : 'Register New Employee';
    document.getElementById('saveBtn').innerText = isEdit ? 'Save Changes' : 'Register Account';
    document.getElementById('modal').style.display = 'flex';
    if (!isEdit) { document.getElementById('regForm').reset(); document.getElementById('regForm').employeeId.readOnly = false; }
}

function hideModal() { document.getElementById('modal').style.display = 'none'; }

function prepareEdit(eid) {
    const u = allUsers.find(x => x.employeeId === eid);
    if (!u) return;
    currentEditId = eid;
    const f = document.getElementById('regForm');
    f.employeeId.value = u.employeeId; f.employeeId.readOnly = true;
    f.fullName.value = u.fullName; f.email.value = u.email;
    f.password.value = ''; f.password.placeholder = 'Leave blank to keep current';
    f.role.value = u.role; f.department.value = u.department || '';
    f.whatsappNumber.value = u.whatsappNumber || '';
    if (f.phone) f.phone.value = u.phone || '';
    showModal(true);
}

async function saveUser(event) {
    const f = document.getElementById('regForm');
    const req = isEditMode ? ['fullName', 'email'] : ['employeeId', 'fullName', 'email', 'password'];
    for (let r of req) { if (!f[r].value) return alert(r + ' is required!'); }
    const fd = new FormData(f);
    const data = Object.fromEntries(fd.entries());
    if (isEditMode && !data.password) delete data.password;
    const btn = event.target;
    btn.disabled = true; btn.innerText = 'Processing...';
    try {
        const url = isEditMode ? \`/api/auth/user/\${currentEditId}\` : '/api/auth/create';
        const r = await fetch(url, { method: isEditMode ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` }, body: JSON.stringify(data) });
        const res = await r.json();
        if (r.ok) { alert(isEditMode ? 'Updated!' : 'Account created!'); hideModal(); loadUsers(); }
        else { alert(res.error || 'Failed'); }
    } catch (e) { alert('Network error'); }
    finally { btn.disabled = false; btn.innerText = isEditMode ? 'Save Changes' : 'Register Account'; }
}

loadUsers();
<\/script>
<script src="/js/notifications.js"><\/script>
</body>
</html>`;

fs.writeFileSync('frontend/employees.html', htmlPart + scriptPart);
console.log('employees.html FIXED - clean script, no duplicates!');
