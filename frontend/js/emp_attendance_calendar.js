let calCurrentDate = new Date();
let employeeAttendanceData = [];
let companyHolidays = [];

async function loadCalendarData() {
    try {
        const token = localStorage.getItem('token');
        const [attRes, holRes] = await Promise.all([
            fetch('/api/attendance/mine', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/holidays', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        employeeAttendanceData = await attRes.json();
        companyHolidays = await holRes.json();
        renderCalendar();
    } catch(err) {
        console.error('Error loading calendar data:', err);
    }
}

function calPrevMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
    renderCalendar();
}

function calNextMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
    renderCalendar();
}

function renderCalendar() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    
    document.getElementById('calMonthDisplay').innerText = calCurrentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayDate = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    let presentCount = 0, absentCount = 0, leaveCount = 0, holidayCount = 0;

    // Fill blank days before 1st
    for (let i = 0; i < firstDayIndex; i++) {
        grid.innerHTML += `<div style="background:none;"></div>`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 1; i <= lastDayDate; i++) {
        // Date formatting YYYY-MM-DD
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayOfWeek = new Date(year, month, i).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        
        // Find holiday
        const holiday = companyHolidays.find(h => h.date === dateStr);
        
        // Find attendance
        const att = employeeAttendanceData.find(a => a.date === dateStr);
        
        let bgColor = '#fff';
        let borderColor = 'var(--border-soft)';
        let textColor = 'var(--text-main)';
        let badgeHtml = '';
        let statusDisplay = '';

        if (isWeekend) {
            bgColor = '#f3f4f6';
            textColor = '#9ca3af';
            statusDisplay = 'Weekend';
            holidayCount++;
        }
        
        if (holiday) {
            bgColor = '#f3f4f6';
            textColor = '#9ca3af';
            statusDisplay = holiday.name;
            if (!isWeekend) holidayCount++; // Don't double count weekends
            badgeHtml = `<div style="font-size:9px;color:var(--primary);margin-top:2px;">${holiday.name}</div>`;
        }

        if (att) {
            if (att.status === 'Present' || att.status === 'Half Day') {
                bgColor = '#f0fdf4';
                borderColor = '#16a34a';
                textColor = '#166534';
                presentCount++;
                statusDisplay = att.status;
            } else if (att.status === 'Absent') {
                bgColor = '#fef2f2';
                borderColor = '#dc2626';
                textColor = '#991b1b';
                absentCount++;
                statusDisplay = 'Absent';
            } else if (att.status === 'Leave') {
                bgColor = '#fffbeb';
                borderColor = '#d97706';
                textColor = '#92400e';
                leaveCount++;
                statusDisplay = 'Leave';
            }
            if(att.loginTime) {
                const clockIn = new Date(att.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const clockOut = att.logoutTime ? new Date(att.logoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                badgeHtml += `<div style="font-size:9px;margin-top:4px;">${clockIn} - ${clockOut}</div>`;
            }
        }

        const isToday = dateStr === todayStr;
        if (isToday) {
            borderColor = 'var(--accent)';
            bgColor = '#eff6ff';
        }

        grid.innerHTML += `
            <div style="border:1px solid ${borderColor}; background:${bgColor}; color:${textColor}; border-radius:6px; padding:10px; display:flex; flex-direction:column; min-height:60px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; font-size:14px; ${isToday ? 'background:var(--accent);color:white;padding:2px 6px;border-radius:4px;' : ''}">${i}</span>
                    <span style="font-size:9px; font-weight:600; text-transform:uppercase;">${statusDisplay}</span>
                </div>
                ${badgeHtml}
            </div>
        `;
    }

    document.getElementById('calStatPresent').innerText = presentCount;
    document.getElementById('calStatAbsent').innerText = absentCount;
    document.getElementById('calStatLeave').innerText = leaveCount;
    document.getElementById('calStatHoliday').innerText = holidayCount;
}

// ═══ MY LEAVES SECTION ═══
async function empLoadMyLeaves() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/leaves/my-leaves', { headers: { Authorization: `Bearer ${token}` } });
        const leaves = await res.json();
        
        const tbody = document.getElementById('myLeavesTableBody');
        tbody.innerHTML = '';
        if (!leaves || !leaves.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-light);">No leave requests found.</td></tr>';
            return;
        }

        leaves.forEach(l => {
            const finalColor = l.status === 'Approved' ? '#16a34a' : l.status === 'Rejected' ? '#dc2626' : l.status === 'Hold' ? '#8b5cf6' : '#f59e0b';
            const hrColor = l.hrStatus === 'Approved' ? '#16a34a' : l.hrStatus === 'Rejected' ? '#dc2626' : l.hrStatus === 'Hold' ? '#8b5cf6' : '#f59e0b';
            
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-soft)';
            tr.innerHTML = `
                <td style="padding:10px;">
                    <div style="font-weight:600;font-size:13px;color:var(--primary);">${l.type || 'Leave'}</div>
                    <div style="font-size:11px;color:var(--text-light);">${l.reason}</div>
                </td>
                <td style="padding:10px;font-size:12px;font-weight:600;color:var(--text-main);">
                    ${l.startDate} &rarr; ${l.endDate}
                </td>
                <td style="padding:10px;text-align:center;">
                    <span style="color:${hrColor};font-size:11px;font-weight:700;">${l.hrStatus}</span>
                </td>
                <td style="padding:10px;text-align:center;">
                    <span style="background:${finalColor}22;color:${finalColor};padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">${l.status}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error('Error loading my leaves:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadCalendarData();
        empLoadMyLeaves();
    }, 1000);
});
