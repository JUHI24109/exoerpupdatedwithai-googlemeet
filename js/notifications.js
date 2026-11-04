// Global Notification System
// Requires Socket.io, FontAwesome

let notifSocket = null;

async function initNotifications() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return;
    const user = JSON.parse(userStr);

    // Inject Notification UI (Panel only, hide the bell since HTML has it)
    const notifContainer = document.createElement('div');
    notifContainer.id = 'global-notif-container';
    notifContainer.innerHTML = `
        <div class="notif-panel" id="notifPanel" style="display:none;">
            <div class="notif-header">
                <b>Notifications</b>
                <span onclick="markAllRead()" style="cursor:pointer; font-size:12px; color:var(--accent);">Mark all read</span>
            </div>
            <div class="notif-list" id="notifList"></div>
        </div>
    `;
    document.body.appendChild(notifContainer);

    // Add Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #global-notif-container { position: fixed; top: 60px; right: 20px; z-index: 9999; pointer-events: none; }
        .notif-panel { width: 320px; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid #ddd; overflow: hidden; display: flex; flex-direction: column; max-height: 450px; pointer-events: auto; }
        .notif-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc; }
        .notif-list { padding: 10px; overflow-y: auto; flex: 1; }
        .notif-item { padding: 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; cursor: pointer; transition: 0.2s; border-left: 3px solid transparent; }
        .notif-item:hover { background: #f1f5f9; }
        .notif-item.unread { background: #eff6ff; border-left-color: var(--accent, #3b82f6); }
        .notif-title { font-weight: bold; margin-bottom: 4px; color: #1e293b; }
        .notif-msg { color: #64748b; font-size: 12px; }
        .notif-time { font-size: 10px; color: #94a3b8; margin-top: 6px; display: block; }
        .toast-notif { position: fixed; top: 20px; right: 20px; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 15px 50px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 15px; z-index: 10000; animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border-left: 5px solid var(--accent, #3b82f6); color: #1e293b; min-width: 250px; }
        @keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .ui-badge { position: absolute; top: -5px; right: -5px; background: #10b981; color: white; font-size: 10px; font-weight: 800; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 99px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px white, 0 2px 6px rgba(16,185,129,0.5); animation: badgePulse 1.8s infinite; }
        @keyframes badgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); box-shadow: 0 0 0 4px rgba(16,185,129,0.3); } }
    `;
    document.head.appendChild(style);

    // Bind existing bell icons
    const setupBells = () => {
        document.querySelectorAll('.fa-bell').forEach(bell => {
            if (bell.dataset.notifBound) return;
            bell.dataset.notifBound = 'true';
            
            // Skip toasts
            if (bell.closest('.toast-notif')) return;

            // Wrap the bell in a relative container so badge positions correctly
            const wrapper = document.createElement('span');
            wrapper.style.position = 'relative';
            wrapper.style.cursor = 'pointer';
            wrapper.style.display = 'inline-block';
            
            bell.parentNode.insertBefore(wrapper, bell);
            wrapper.appendChild(bell);
            
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNotifPanel();
            });
            
            // Add dynamic badge
            const b = document.createElement('span');
            b.className = 'ui-badge';
            b.style.display = 'none';
            b.style.top = '-8px';
            b.style.right = '-8px';
            wrapper.appendChild(b);
        });
    };
    setupBells();
    // Re-check bells periodically in case of dynamic UI
    setInterval(setupBells, 2000);

    // Close panel on click outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notifPanel');
        if (panel && panel.style.display === 'flex' && !panel.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    await fetchNotifications();

    // Connect Socket
    if (typeof io !== 'undefined') {
        notifSocket = io({ path: '/api/socket.io', transports: ['polling'] });
        console.log('Global Notif Socket Initializing...');
        notifSocket.on('connect', () => console.log('✅ Notif Socket Connected:', notifSocket.id));
        notifSocket.on('connect_error', (err) => console.error('❌ Notif Socket Error:', err));
        
        // Join rooms for both IDs to ensure we get all messages
        notifSocket.emit('join', user.id);
        notifSocket.emit('join', user.employeeId);

        notifSocket.on('new_notification', (notif) => {
            showToast(notif);
            fetchNotifications();
        });
    }
}

function toggleNotifPanel() {
    const p = document.getElementById('notifPanel');
    p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}

async function fetchNotifications() {
    try {
        const res = await fetch('/api/notifications', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        const list = document.getElementById('notifList');
        list.innerHTML = '';
        
        let unread = 0;
        
        if (data.length === 0) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#999; font-size:13px;">No notifications yet</div>';
        } else {
            data.forEach(n => {
                if (!n.isRead) unread++;
                list.innerHTML += `
                    <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="markRead(${n.id}, '${n.type || ''}', ${n.relatedId || null})">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-msg">${n.message}</div>
                        <div class="notif-time">${new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                `;
            });
        }
        
        // Update all badges on screen
        document.querySelectorAll('.ui-badge, .notif-badge').forEach(b => {
            if (unread > 0) {
                b.innerText = unread;
                b.style.display = 'flex';
            } else {
                b.style.display = 'none';
            }
        });
    } catch (e) { console.error(e); }
}

async function markRead(id, type, relatedId) {
    try {
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchNotifications();
        
        if (type === 'TICKET' && relatedId) {
            window.location.href = '/tickets.html?id=' + relatedId;
        } else if (type === 'TASK' && relatedId) {
            window.location.href = '/tasks.html?id=' + relatedId;
        }
    } catch (e) {}
}

async function markAllRead() {
    try {
        await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchNotifications();
    } catch (e) {}
}

function showToast(notif) {
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.innerHTML = `
        <i class="fa-solid fa-bell" style="color:var(--accent); font-size:20px;"></i>
        <div>
            <div style="font-weight:bold; font-size:14px;">${notif.title}</div>
            <div style="font-size:12px; color:#555;">${notif.message}</div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();

    // Dynamically inject Undertakings nav link for executives across all pages
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (['HR', 'HR Manager', 'CEO', 'Chairman'].includes(user.role)) {
            const navList = document.querySelector('.nav-list');
            if (navList && !document.getElementById('navUndertakings') && !document.getElementById('navUndertakingsGlobal')) {
                const undertakingsLink = document.createElement('a');
                undertakingsLink.href = 'undertakings.html';
                undertakingsLink.className = 'nav-link';
                if (window.location.pathname.includes('undertakings.html')) {
                    undertakingsLink.classList.add('active');
                }
                undertakingsLink.id = 'navUndertakingsGlobal';
                undertakingsLink.innerHTML = '<i class="fa-solid fa-handshake"></i> Undertakings';
                
                const flexSpacer = navList.querySelector('div[style*="flex:1"]') || navList.querySelector('div[style*="flex: 1"]');
                if (flexSpacer) {
                    navList.insertBefore(undertakingsLink, flexSpacer);
                } else {
                    navList.appendChild(undertakingsLink);
                }
            }
        }
    }
});
