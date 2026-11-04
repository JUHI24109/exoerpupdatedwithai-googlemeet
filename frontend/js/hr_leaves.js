async function hrLoadLeaves() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/leaves/all', { headers: { Authorization: `Bearer ${token}` } });
        const leaves = await res.json();
        const tbody = document.getElementById('hrLeavesTableBody');
        tbody.innerHTML = '';
        if (!leaves || !leaves.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-light);">No leave requests found.</td></tr>';
            return;
        }

        leaves.forEach(l => {
            const empName = l.Employee ? l.Employee.fullName : 'Unknown';
            const empRole = l.Employee ? l.Employee.role : '';
            const statusColor = l.status === 'Approved' ? '#16a34a' : l.status === 'Rejected' ? '#dc2626' : l.status === 'Hold' ? '#8b5cf6' : '#f59e0b';
            
            let actions = '';
            if (l.status === 'Pending' || l.status === 'Hold') {
                actions = `
                    <button onclick="hrUpdateLeave(${l.id}, 'Approved')" style="background:#16a34a;color:white;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;"><i class="fa-solid fa-check"></i> Approve</button>
                    <button onclick="hrUpdateLeave(${l.id}, 'Rejected')" style="background:#dc2626;color:white;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;"><i class="fa-solid fa-xmark"></i> Reject</button>
                    ${l.status === 'Pending' ? `<button onclick="hrUpdateLeave(${l.id}, 'Hold')" style="background:#8b5cf6;color:white;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;"><i class="fa-solid fa-pause"></i> Hold</button>` : ''}
                `;
            } else {
                actions = `<span style="font-size:11px;color:var(--text-light);font-style:italic;">No actions</span>`;
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-soft)';
            tr.innerHTML = `
                <td style="padding:10px;">
                    <div style="font-weight:700;font-size:13px;">${empName}</div>
                    <div style="font-size:11px;color:var(--text-light);">${empRole}</div>
                </td>
                <td style="padding:10px;">
                    <div style="font-weight:600;font-size:12px;color:var(--primary);">${l.type || 'Leave'}</div>
                    <div style="font-size:11px;color:var(--text-light);">${l.reason}</div>
                </td>
                <td style="padding:10px;font-size:12px;font-weight:600;">
                    ${l.startDate} &rarr; ${l.endDate}
                </td>
                <td style="padding:10px;text-align:center;">
                    <span style="background:${statusColor}22;color:${statusColor};padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">${l.status}</span>
                </td>
                <td style="padding:10px;text-align:center;display:flex;gap:6px;justify-content:center;">
                    ${actions}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error('Error loading leaves:', err);
    }
}

async function hrUpdateLeave(id, status) {
    if (!confirm(`Are you sure you want to mark this leave as ${status}?`)) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/leaves/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            hrLoadLeaves();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to update leave');
        }
    } catch(err) {
        console.error('Error updating leave:', err);
    }
}

// Load leaves on init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(hrLoadLeaves, 1000);
});
