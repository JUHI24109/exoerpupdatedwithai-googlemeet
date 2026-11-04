async function hrLoadHolidays() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/holidays', { headers: { Authorization: `Bearer ${token}` } });
        const holidays = await res.json();
        const tbody = document.getElementById('holidaysTableBody');
        tbody.innerHTML = '';
        if (!holidays || !holidays.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-light);">No holidays configured.</td></tr>';
            return;
        }

        holidays.forEach(h => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-soft)';
            tr.innerHTML = `
                <td style="padding:10px;font-weight:700;font-size:13px;">${h.date}</td>
                <td style="padding:10px;font-size:13px;">${h.name}</td>
                <td style="padding:10px;">
                    <span style="background:var(--pink-bg);color:var(--primary);padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">${h.type}</span>
                </td>
                <td style="padding:10px;text-align:center;">
                    <button onclick="deleteHoliday(${h.id})" style="background:#dc2626;color:white;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error('Error loading holidays:', err);
    }
}

async function addHoliday() {
    const date = document.getElementById('holDate').value;
    const name = document.getElementById('holName').value;
    const type = document.getElementById('holType').value;
    
    if (!date || !name) return alert('Please enter date and name');

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date, name, type })
        });
        if (res.ok) {
            document.getElementById('holDate').value = '';
            document.getElementById('holName').value = '';
            hrLoadHolidays();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to add holiday');
        }
    } catch(err) {
        console.error('Error adding holiday:', err);
    }
}

async function deleteHoliday(id) {
    if (!confirm('Delete this holiday?')) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/holidays/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            hrLoadHolidays();
        } else {
            alert('Failed to delete holiday');
        }
    } catch(err) {
        console.error('Error deleting holiday:', err);
    }
}

// Load holidays on init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(hrLoadHolidays, 1000);
});
