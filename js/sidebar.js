/**
 * EXO GLOBAL Enterprise ERP — Unified & Stable Sidebar Component
 * Guarantees 100% consistent sidebar layout, links, logo, and active states
 * across all ERP pages without shifting or vanishing items.
 * 
 * ✅ WhatsApp-style notification badges on Chat & Tickets
 * ✅ Real-time Socket.io listeners for instant badge updates
 * ✅ Audio chime on new notifications
 */

(function () {
    function getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    }

    const user = getStoredUser();
    const role = (user.role || '').trim();
    const isExecutiveOrHR = ['IT Admin', 'Chairman', 'CEO', 'HR', 'HR Manager', 'CFO', 'Director'].includes(role);

    // Global logout handler
    window.logout = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (err) {}
        window.location.href = 'index.html';
    };

    // Determine current page & query
    const pathname = window.location.pathname;
    let currentPage = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
    if (currentPage === '' || currentPage === '/') currentPage = 'index.html';
    const searchParams = new URLSearchParams(window.location.search);
    const activeTab = searchParams.get('tab');

    // Dashboard target based on role
    const dashboardHref = 'dashboard.html';

    // Sidebar navigation items list
    const navItems = [
        {
            id: 'nav-dashboard',
            label: 'Dashboard',
            icon: 'fa-solid fa-house',
            href: dashboardHref,
            isActive: (currentPage === 'dashboard.html' || currentPage === 'dashboard-employee.html') && !activeTab,
            onClick: currentPage === 'dashboard.html' ? "switchDashSection('main')" : null
        },
        {
            id: 'nav-attendance',
            label: 'Attendance',
            icon: 'fa-solid fa-user-check',
            href: 'attendance.html',
            isActive: currentPage === 'attendance.html'
        },
        {
            id: 'nav-tickets',
            label: 'Tickets',
            icon: 'fa-solid fa-ticket',
            href: 'tickets.html',
            isActive: currentPage === 'tickets.html',
            badgeId: 'sidebar-ticket-badge'
        },
        {
            id: 'nav-chat',
            label: 'Chat',
            icon: 'fa-solid fa-message',
            href: 'chat.html',
            isActive: currentPage === 'chat.html',
            badgeId: 'sidebar-chat-badge'
        },
        {
            id: 'nav-ai',
            label: 'AI Copilot',
            icon: 'fa-solid fa-robot',
            href: 'ai-assistant.html',
            isActive: currentPage === 'ai-assistant.html'
        },
        {
            id: 'nav-meeting',
            label: 'Live Meeting',
            icon: 'fa-solid fa-video',
            href: 'meeting.html',
            isActive: currentPage === 'meeting.html'
        },
        {
            id: 'nav-documents',
            label: 'Documents',
            icon: 'fa-solid fa-folder-open',
            href: 'documents.html',
            isActive: currentPage === 'documents.html'
        },
        {
            id: 'nav-history',
            label: 'History Center',
            icon: 'fa-solid fa-clock-rotate-left',
            href: 'history.html',
            isActive: currentPage === 'history.html'
        }
    ];

    // ── Executive/HR-only items: Leave Requests, Holidays, Undertakings, Profile Mapping ──
    if (isExecutiveOrHR) {
        navItems.push(
            {
                id: 'nav-leaves',
                label: 'Leave Requests',
                icon: 'fa-solid fa-calendar-xmark',
                href: 'dashboard.html?tab=leaves',
                isActive: currentPage === 'dashboard.html' && activeTab === 'leaves'
            },
            {
                id: 'nav-holidays',
                label: 'Holidays',
                icon: 'fa-solid fa-umbrella-beach',
                href: 'dashboard.html?tab=holidays',
                isActive: currentPage === 'dashboard.html' && activeTab === 'holidays'
            },
            {
                id: 'nav-undertakings',
                label: 'Undertakings',
                icon: 'fa-solid fa-file-signature',
                href: 'undertakings.html',
                isActive: currentPage === 'undertakings.html'
            },
            {
                id: 'nav-profile-mapping',
                label: 'Profile Mapping',
                icon: 'fa-solid fa-sitemap',
                href: 'profile-mapping.html',
                isActive: currentPage === 'profile-mapping.html'
            }
        );
    }

    // Employees tab – visible ONLY to Executive & HR roles (Chairman, CEO, IT Admin, HR)
    // Regular employees must NOT have access to all employees directory
    if (isExecutiveOrHR) {
        navItems.splice(1, 0, {
            id: 'nav-employees',
            label: 'Employees',
            icon: 'fa-solid fa-users',
            href: 'employees.html',
            isActive: currentPage === 'employees.html'
        });
    }

    // Projects tab – visible to Chairman, CEO, IT Admin always;
    // also visible to any other role that has at least one project membership (checked async below)
    const isProjectsEligible = ['Chairman', 'CEO', 'IT Admin'].includes(role);
    if (isProjectsEligible) {
        const projectInsertIndex = isExecutiveOrHR ? 4 : 3;
        navItems.splice(projectInsertIndex, 0, {
            id: 'nav-projects',
            label: 'Projects',
            icon: 'fa-solid fa-building-columns',
            href: 'projects.html',
            isActive: currentPage === 'projects.html' || currentPage === 'project-workspace.html',
            badgeId: 'sidebar-projects-badge'
        });
    }

    // Badge HTML generator
    function makeBadge(badgeId) {
        if (!badgeId) return '';
        return `<span class="sidebar-notif-badge" id="${badgeId}" style="display:none;">0</span>`;
    }

    // Build items HTML
    const navLinksHTML = navItems.map(item => {
        const activeClass = item.isActive ? ' active' : '';
        const clickAttr = item.onClick ? ` onclick="${item.onClick}; return false;"` : '';
        const badgeSlot = makeBadge(item.badgeId);
        // If inside Live Meeting, open Chat in new tab so call doesn't terminate
        const targetAttr = (currentPage === 'meeting.html' && item.id === 'nav-chat') ? ' target="_blank" rel="noopener"' : '';
        return `
            <a href="${item.href}" class="nav-link${activeClass}" id="${item.id}"${clickAttr}${targetAttr}>
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                ${badgeSlot}
            </a>
        `;
    }).join('\n');

    const sidebarHTML = `
        <div class="logo" style="position:relative;">
            <a href="${dashboardHref}" style="display:flex;align-items:center;justify-content:center;text-decoration:none;">
                <img src="exologo.png" class="sidebar-logo" alt="EXO GLOBAL" />
            </a>
            <button class="drawer-close-btn" onclick="window.toggleMobileSidebar && window.toggleMobileSidebar(false)" title="Close menu">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <nav class="sidebar-nav">
            ${navLinksHTML}
            <div style="flex:1; min-height:12px;"></div>
            <a href="javascript:void(0)" onclick="window.installExoApp && window.installExoApp()" class="nav-link exo-pwa-install-trigger" id="nav-install-app" style="color:#38bdf8; border:1px dashed rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.08); margin-bottom: 6px;">
                <i class="fa-solid fa-download"></i>
                <span>Install App</span>
            </a>
            <a href="profile.html" class="nav-link${currentPage === 'profile.html' ? ' active' : ''}" id="nav-profile">
                <i class="fa-solid fa-id-badge"></i>
                <span>My Profile</span>
            </a>
            <a href="javascript:void(0)" onclick="logout(event)" class="nav-link nav-logout" id="nav-logout">
                <i class="fa-solid fa-power-off"></i>
                <span>Logout</span>
            </a>
        </nav>
    `;

    // Ensure unified styles exist in <head>
    function injectSidebarStyles() {
        if (document.getElementById('exo-stable-sidebar-css')) return;
        const style = document.createElement('style');
        style.id = 'exo-stable-sidebar-css';
        style.textContent = `
            /* Desktop Sidebar Layout */
            @media (min-width: 993px) {
                #sidebar {
                    width: 250px !important;
                    min-width: 250px !important;
                    max-width: 250px !important;
                    background: #1e293b !important;
                    border-right: 2px solid #334155 !important;
                    height: 100vh !important;
                    position: sticky !important;
                    top: 0 !important;
                    left: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    flex-shrink: 0 !important;
                    z-index: 9999 !important;
                    box-sizing: border-box !important;
                    box-shadow: 2px 0 10px rgba(0,0,0,0.15) !important;
                    transform: none !important;
                }
                #sidebar .drawer-close-btn {
                    display: none !important;
                }
            }

            /* Mobile & Tablet Drawer Layout (<= 992px) */
            @media (max-width: 992px) {
                body {
                    flex-direction: column !important;
                    height: 100dvh !important;
                    max-height: 100dvh !important;
                    overflow: hidden !important;
                    padding-top: calc(60px + env(safe-area-inset-top, 0px)) !important;
                }
                #sidebar {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    bottom: 0 !important;
                    width: 280px !important;
                    max-width: 85vw !important;
                    height: 100dvh !important;
                    background: #0f172a !important;
                    border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
                    z-index: 100000 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    transform: translate3d(-100%, 0, 0) !important;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: none !important;
                    box-sizing: border-box !important;
                }
                #sidebar.mobile-open {
                    transform: translate3d(0, 0, 0) !important;
                    box-shadow: 12px 0 40px rgba(0,0,0,0.6) !important;
                }
                #sidebar .drawer-close-btn {
                    display: flex !important;
                }
                main {
                    flex: 1 !important;
                    width: 100% !important;
                    max-width: 100vw !important;
                    height: calc(100dvh - 60px - env(safe-area-inset-top, 0px)) !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    -webkit-overflow-scrolling: touch !important;
                }
            }
            #sidebar .logo {
                height: 90px !important;
                min-height: 90px !important;
                padding: 0 18px !important;
                border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                background: #1e293b !important;
            }
            #sidebar .sidebar-logo {
                max-width: 170px !important;
                max-height: 48px !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
                display: block !important;
                filter: brightness(0) invert(1) !important;
                transition: transform 0.2s ease !important;
            }
            #sidebar .sidebar-logo:hover {
                transform: scale(1.02) !important;
            }
            #sidebar nav.sidebar-nav,
            #sidebar nav {
                flex: 1 !important;
                padding: 14px 10px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 4px !important;
                overflow-y: auto !important;
                box-sizing: border-box !important;
            }
            #sidebar nav::-webkit-scrollbar {
                width: 5px !important;
            }
            #sidebar nav::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.15) !important;
                border-radius: 4px !important;
            }
            #sidebar .nav-link,
            #sidebar .nav-item {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 10px 14px !important;
                border-radius: 6px !important;
                color: #e2e8f0 !important;
                text-decoration: none !important;
                font-family: 'Inter', -apple-system, sans-serif !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                line-height: 1.2 !important;
                transition: all 0.18s ease !important;
                border: 1px solid transparent !important;
                box-sizing: border-box !important;
                cursor: pointer !important;
                position: relative !important;
            }
            #sidebar .nav-link i,
            #sidebar .nav-item i {
                width: 18px !important;
                text-align: center !important;
                font-size: 14px !important;
                color: #94a3b8 !important;
                transition: color 0.18s ease !important;
            }
            #sidebar .nav-link:hover,
            #sidebar .nav-item:hover {
                background: rgba(255, 255, 255, 0.08) !important;
                color: #ffffff !important;
                border-color: rgba(255, 255, 255, 0.06) !important;
            }
            #sidebar .nav-link:hover i,
            #sidebar .nav-item:hover i {
                color: #38bdf8 !important;
            }
            #sidebar .nav-link.active,
            #sidebar .nav-item.active {
                background: rgba(14, 165, 233, 0.18) !important;
                border: 1px solid #0ea5e9 !important;
                box-shadow: inset 3px 0 0 #0ea5e9 !important;
                color: #ffffff !important;
                font-weight: 700 !important;
            }
            #sidebar .nav-link.active i,
            #sidebar .nav-item.active i {
                color: #38bdf8 !important;
            }
            #sidebar .nav-logout {
                color: #f87171 !important;
            }
            #sidebar .nav-logout i {
                color: #f87171 !important;
            }
            #sidebar .nav-logout:hover {
                background: rgba(239, 68, 68, 0.12) !important;
                border-color: rgba(239, 68, 68, 0.25) !important;
                color: #ef4444 !important;
            }
            #sidebar .nav-logout:hover i {
                color: #ef4444 !important;
            }

            /* ═══ WhatsApp-style Notification Badges ═══ */
            .sidebar-notif-badge {
                display: none;
                align-items: center;
                justify-content: center;
                margin-left: auto;
                min-width: 20px;
                height: 20px;
                padding: 0 6px;
                border-radius: 99px;
                font-size: 10.5px;
                font-weight: 800;
                font-family: 'Inter', -apple-system, sans-serif;
                color: #ffffff;
                background: #25D366;
                box-shadow: 0 2px 8px rgba(37, 211, 102, 0.45);
                line-height: 1;
                letter-spacing: 0.3px;
                animation: badgePop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                flex-shrink: 0;
            }
            #sidebar-ticket-badge {
                background: linear-gradient(135deg, #f59e0b, #ef4444) !important;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.45) !important;
            }
            #sidebar-projects-badge {
                background: #10b981 !important;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5) !important;
            }

            @keyframes badgePop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes badgePulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
                50% { box-shadow: 0 0 0 6px rgba(37, 211, 102, 0); }
            }
            .sidebar-notif-badge.pulse {
                animation: badgePulse 1.5s ease-in-out 3;
            }

            #exo-floating-ai-btn {
                position: fixed !important;
                bottom: 24px !important;
                right: 24px !important;
                width: 52px !important;
                height: 52px !important;
                border-radius: 50% !important;
                background: linear-gradient(135deg, #0284c7, #2563eb) !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 22px !important;
                box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45) !important;
                z-index: 99999 !important;
                cursor: pointer !important;
                text-decoration: none !important;
                transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }
            #exo-floating-ai-btn:hover {
                transform: scale(1.1) translateY(-3px) !important;
                box-shadow: 0 10px 25px rgba(56, 189, 248, 0.6) !important;
            }

        `;
        document.head.appendChild(style);
    }

    // Topbar Profile Auto-Hydration (Fixes 'U / User / Employee' across ERP)
    function hydrateTopbars() {
        const displayName = user.name || user.fullName || user.employeeId || 'User';
        const displayRole = user.role || 'Employee';
        const displayInitial = displayName.charAt(0).toUpperCase();

        const nameEls = document.querySelectorAll('#uName, #topUserName, .user-name, #userName');
        nameEls.forEach(el => {
            if (el && (!el.innerText || el.innerText.trim() === 'User' || el.innerText.trim() === 'John Doe')) {
                el.innerText = displayName;
            }
        });

        const roleEls = document.querySelectorAll('#uRole, #topUserRole, .user-role, #userRole');
        roleEls.forEach(el => {
            if (el && (!el.innerText || el.innerText.trim() === 'Role' || el.innerText.trim() === 'Employee')) {
                el.innerText = displayRole;
            }
        });

        const avEls = document.querySelectorAll('#uAv, #topUserAvatar, .user-avatar, #userAvatar');
        avEls.forEach(el => {
            if (el && (!el.innerText || el.innerText.trim() === 'U')) {
                el.innerText = displayInitial;
            }
        });
    }

    // ═══ Badge Update Helper ═══
    function updateBadge(badgeId, count) {
        const badge = document.getElementById(badgeId);
        if (!badge) return;
        if (count > 0) {
            badge.innerText = count > 99 ? '99+' : count;
            badge.style.display = 'inline-flex';
            // Add pulse animation on update
            badge.classList.remove('pulse');
            void badge.offsetWidth; // reflow trigger
            badge.classList.add('pulse');
        } else {
            badge.style.display = 'none';
        }
    }

    // ═══ Notification Audio Chime ═══
    function playNotifChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            // WhatsApp-like two-tone chime
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
    }

    // ═══ Sync Chat Unread Count ═══
    async function syncUnreadChatCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/chat/unread', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const d = await res.json();
            const total = d.total || 0;
            updateBadge('sidebar-chat-badge', total);
        } catch (e) {}
    }

    // ═══ Sync Ticket Unread Count ═══
    async function syncUnreadTicketCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/tickets/unread-count', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const d = await res.json();
            const total = d.total || 0;
            updateBadge('sidebar-ticket-badge', total);
        } catch (e) {}
    }

    // ═══ Sync Project Unread Count ═══
    async function syncUnreadProjectCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/projects/unread-count', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const d = await res.json();
            const total = d.total || 0;
            updateBadge('sidebar-projects-badge', total);
        } catch (e) {}
    }

    // ═══ Real-time Socket.io Listener ═══
    function initRealtimeNotifications() {
        // Load Socket.io if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => connectSocket();
            document.head.appendChild(script);
        } else {
            connectSocket();
        }
    }

    function connectSocket() {
        try {
            if (typeof io === 'undefined') return;
            const socket = io({ path: '/api/socket.io', transports: ['websocket', 'polling'] });

            // Join user's personal notification room
            const userId = user.id;
            if (userId) {
                socket.emit('join', String(userId));
            }

            // ── Chat: New message received ──
            socket.on('receive_message', (msg) => {
                // Only increment if we're NOT on the chat page
                if (currentPage !== 'chat.html') {
                    syncUnreadChatCount();
                    playNotifChime();
                }
            });

            // ── Chat: Direct unread update from server ──
            socket.on('chat_unread_update', () => {
                syncUnreadChatCount();
            });

            // ── Tickets: New ticket event ──
            socket.on('ticket_update', (data) => {
                if (data && (data.action === 'created' || data.action === 'transferred' || data.action === 'comment_added')) {
                    // Refresh ticket badge count
                    syncUnreadTicketCount();
                    // Play chime if not on tickets page
                    if (currentPage !== 'tickets.html') {
                        playNotifChime();
                    }
                }
            });

            // ── Projects: Project update event ──
            socket.on('project_update', (data) => {
                syncUnreadProjectCount();
                if (currentPage !== 'projects.html' && currentPage !== 'project-workspace.html') {
                    playNotifChime();
                    showToastNotification(data.title || 'Project Update', data.message || 'New update in project');
                }
            });

            // ── General notification from server ──
            socket.on('new_notification', (notif) => {
                if (notif && notif.type === 'TICKET') {
                    syncUnreadTicketCount();
                    if (currentPage !== 'tickets.html') {
                        playNotifChime();
                        showToastNotification(notif.title, notif.message);
                    }
                } else if (notif && notif.type === 'PROJECT') {
                    syncUnreadProjectCount();
                    if (currentPage !== 'projects.html' && currentPage !== 'project-workspace.html') {
                        playNotifChime();
                        showToastNotification(notif.title, notif.message);
                    }
                }
            });

            // Store socket reference globally
            window._exoSidebarSocket = socket;
        } catch (e) {
            console.warn('Sidebar socket connection failed:', e);
        }
    }

    // ═══ Toast Notification Popup (WhatsApp-style) ═══
    function showToastNotification(title, message) {
        // Create toast container if needed
        let container = document.getElementById('exo-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'exo-toast-container';
            container.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                display: flex; flex-direction: column; gap: 10px; pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            pointer-events: auto;
            background: linear-gradient(135deg, #1e293b, #334155);
            color: #f1f5f9;
            padding: 14px 18px;
            border-radius: 12px;
            border-left: 4px solid #25D366;
            box-shadow: 0 8px 30px rgba(0,0,0,0.35);
            font-family: 'Inter', -apple-system, sans-serif;
            max-width: 340px;
            animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        toast.innerHTML = `
            <div style="font-weight:700; font-size:12px; color:#25D366; margin-bottom:4px;">
                🔔 ${title || 'New Notification'}
            </div>
            <div style="font-size:13px; line-height:1.4; color:#cbd5e1;">
                ${message || ''}
            </div>
        `;
        toast.onclick = () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        };

        container.appendChild(toast);

        // Add animation keyframes if not present
        if (!document.getElementById('exo-toast-anim-css')) {
            const s = document.createElement('style');
            s.id = 'exo-toast-anim-css';
            s.textContent = `
                @keyframes toastSlideIn {
                    0% { transform: translateX(120px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(s);
        }

        // Auto-dismiss after 5s
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Inject Floating AI Copilot Launcher
    function injectFloatingAiButton() {
        if (currentPage === 'ai-assistant.html' || currentPage === 'index.html' || document.getElementById('exo-floating-ai-btn')) return;
        const btn = document.createElement('a');
        btn.id = 'exo-floating-ai-btn';
        btn.href = 'ai-assistant.html';
        btn.title = 'AI Copilot / ChatGPT Assistant';
        btn.innerHTML = `<i class="fa-solid fa-robot"></i>`;
        document.body.appendChild(btn);
    }

    // Dashboard internal section switching helper
    window.switchDashSection = function (sectionName) {
        if (typeof window.showSection === 'function') {
            window.showSection(sectionName);
        } else {
            const sections = ['mainSection', 'todoSection', 'leavesSection', 'holidaysSection'];
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            const target = document.getElementById(sectionName + 'Section');
            if (target) target.style.display = 'flex';
        }

        // Update active class on nav links
        document.querySelectorAll('#sidebar .nav-link').forEach(link => link.classList.remove('active'));
        if (sectionName === 'leaves') {
            const el = document.getElementById('nav-leaves');
            if (el) el.classList.add('active');
            history.replaceState(null, '', 'dashboard.html?tab=leaves');
            if (typeof hrLoadLeaves === 'function') hrLoadLeaves();
        } else if (sectionName === 'holidays') {
            const el = document.getElementById('nav-holidays');
            if (el) el.classList.add('active');
            history.replaceState(null, '', 'dashboard.html?tab=holidays');
            if (typeof hrLoadHolidays === 'function') hrLoadHolidays();
        } else {
            const el = document.getElementById('nav-dashboard');
            if (el) el.classList.add('active');
            history.replaceState(null, '', 'dashboard.html');
        }
    };

    // Async: check if a non-super employee has any project memberships
    // and inject the Projects link into the sidebar if so
    async function injectProjectsLinkIfEligible() {
        if (isProjectsEligible) return; // already shown for super roles
        // Already on projects page — always show the link
        if (currentPage === 'projects.html' || currentPage === 'project-workspace.html') {
            _insertProjectsNavLink(true);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const projects = await res.json();
            if (projects && projects.length > 0) {
                _insertProjectsNavLink(false);
            }
        } catch (e) {}
    }

    function _insertProjectsNavLink(isActive) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        if (document.getElementById('nav-projects')) return; // already exists
        const nav = sidebar.querySelector('nav.sidebar-nav');
        if (!nav) return;
        // Insert after the 4th nav link (index 3, after Dashboard/Employees/Attendance/Tickets)
        const links = nav.querySelectorAll('a.nav-link');
        const projectLink = document.createElement('a');
        projectLink.href = 'projects.html';
        projectLink.className = 'nav-link' + (isActive ? ' active' : '');
        projectLink.id = 'nav-projects';
        projectLink.innerHTML = `<i class="fa-solid fa-building-columns"></i><span>Projects</span>${makeBadge('sidebar-projects-badge')}`;
        // Insert after the 4th link (index 3) if it exists, otherwise append before spacer
        const insertAfter = links[3];
        if (insertAfter && insertAfter.nextSibling) {
            nav.insertBefore(projectLink, insertAfter.nextSibling);
        } else {
            const spacer = nav.querySelector('div[style*="flex:1"]');
            if (spacer) nav.insertBefore(projectLink, spacer);
            else nav.appendChild(projectLink);
        }
    }

    // ── Head Meta & PWA / Universal Responsive Injection ──
    function injectHeadMetaAndPwa() {
        // Ensure Viewport with viewport-fit=cover for iPhone notch
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Manifest.json for PWA installation
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            manifestLink.href = 'manifest.json';
            document.head.appendChild(manifestLink);
        }

        // Apple PWA meta tags
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: 'EXO ERP' },
            { name: 'theme-color', content: '#0a192f' }
        ];
        metaTags.forEach(m => {
            if (!document.querySelector(`meta[name="${m.name}"]`)) {
                const el = document.createElement('meta');
                el.name = m.name;
                el.content = m.content;
                document.head.appendChild(el);
            }
        });

        // Apple Touch Icon
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const iconLink = document.createElement('link');
            iconLink.rel = 'apple-touch-icon';
            iconLink.href = 'exologo.png';
            document.head.appendChild(iconLink);
        }

        // Universal Responsive Stylesheet
        if (!document.querySelector('link[href*="responsive-universal.css"]')) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'css/responsive-universal.css';
            document.head.appendChild(cssLink);
        }

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(() => navigator.serviceWorker.register('sw.js').catch(() => {}));
        }
    }

    // Direct PWA Install Handler bundled into sidebar
    let deferredPwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        console.log('[EXO ERP] PWA install prompt ready');
    });

    window.installExoApp = async function () {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (isStandalone) {
            alert('EXO ERP is already installed and running as an app!');
            return;
        }

        if (deferredPwaPrompt) {
            try {
                deferredPwaPrompt.prompt();
                const choice = await deferredPwaPrompt.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    deferredPwaPrompt = null;
                    return;
                }
            } catch(e) {
                console.warn('[EXO ERP] Prompt error:', e);
            }
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        showPwaModal(isIOS ? 'ios' : 'android');
    };

    function showPwaModal(type) {
        const existing = document.getElementById('exo-pwa-guide-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'exo-pwa-guide-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99999999;background:rgba(15,23,42,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;';
        
        const isIOS = type === 'ios';
        const stepsHtml = isIOS ? `
            <div style="display:flex;flex-direction:column;gap:10px;text-align:left;font-size:13px;color:#e2e8f0;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">1</span>
                    <span>Safari ke bottom par <strong>Share</strong> icon <i class="fa-solid fa-arrow-up-from-bracket" style="color:#38bdf8;margin:0 4px;"></i> dabayein.</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">2</span>
                    <span>Neeche scroll karein aur <strong>"Add to Home Screen"</strong> <i class="fa-regular fa-square-plus" style="color:#38bdf8;margin:0 4px;"></i> select karein.</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">3</span>
                    <span>Upar right corner par <strong>Add</strong> dabayein — App install ho jayegi!</span>
                </div>
            </div>
        ` : `
            <div style="display:flex;flex-direction:column;gap:10px;text-align:left;font-size:13px;color:#e2e8f0;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">1</span>
                    <span>Chrome / Browser ke upar <strong>3 dots (⋮ or ⋯)</strong> menu dabayein.</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">2</span>
                    <span>Menu me <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> select karein.</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:#0f172a;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <span style="background:#0ea5e9;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">3</span>
                    <span>Popup par <strong>Install</strong> dabayein — App seedha phone me download/add ho jayegi!</span>
                </div>
            </div>
        `;

        modal.innerHTML = `
            <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.18);border-radius:22px;max-width:400px;width:100%;padding:24px;text-align:center;color:white;position:relative;box-shadow:0 25px 50px rgba(0,0,0,0.7);">
                <button onclick="document.getElementById('exo-pwa-guide-modal').remove()" style="position:absolute;top:14px;right:16px;background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:4px;">&times;</button>
                <div style="width:68px;height:68px;border-radius:16px;background:#0a192f;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,0.4);border:1px solid rgba(56,189,248,0.3);">
                    <img src="icon-192.png" onerror="this.src='exologo.png'" style="width:48px;height:48px;object-fit:contain;" />
                </div>
                <h3 style="font-size:19px;font-weight:800;margin-bottom:6px;letter-spacing:-0.3px;">Install EXO ERP App</h3>
                <p style="font-size:12px;color:#94a3b8;margin-bottom:16px;">Mobile me app install karne ke 3 aasaan steps:</p>
                ${stepsHtml}
                <button onclick="document.getElementById('exo-pwa-guide-modal').remove()" style="width:100%;padding:12px;border-radius:12px;background:linear-gradient(135deg, #0ea5e9, #6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(14,165,233,0.35);">Samajh Gaya / Got It</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Mobile Sidebar Drawer Toggle & Backdrop
    window.toggleMobileSidebar = function (open) {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('exo-sidebar-backdrop');
        if (!sidebar) return;
        const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('mobile-open');
        if (shouldOpen) {
            sidebar.classList.add('mobile-open');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('mobile-open');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    function renderMobileTopBarAndBackdrop() {
        // Mobile Top Bar
        if (!document.getElementById('exo-mobile-topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'exo-mobile-topbar';
            const userInitial = (user.name || user.fullName || 'U').charAt(0).toUpperCase();
            topbar.innerHTML = `
                <button class="mobile-menu-hamburger" onclick="window.toggleMobileSidebar(true)" aria-label="Open navigation menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <a href="${dashboardHref}" style="display:flex;align-items:center;">
                    <img src="exologo.png" class="mobile-brand-logo" alt="EXO GLOBAL" />
                </a>
                <div class="mobile-topbar-actions">
                    <button class="mobile-install-btn exo-pwa-install-trigger" onclick="window.installExoApp && window.installExoApp()" title="Install App">
                        <i class="fa-solid fa-download"></i>
                        <span>Install</span>
                    </button>
                    <a href="profile.html" style="width:34px;height:34px;border-radius:50%;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;text-decoration:none;">
                        ${userInitial}
                    </a>
                </div>
            `;
            document.body.insertBefore(topbar, document.body.firstChild);
        }

        // Dark Backdrop Overlay
        if (!document.getElementById('exo-sidebar-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'exo-sidebar-backdrop';
            backdrop.onclick = () => window.toggleMobileSidebar(false);
            document.body.appendChild(backdrop);
        }
    }

    function renderSidebar() {
        injectHeadMetaAndPwa();
        injectSidebarStyles();
        renderMobileTopBarAndBackdrop();

        let sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            // Profile page or pages lacking sidebar element
            sidebar = document.createElement('aside');
            sidebar.id = 'sidebar';
            document.body.insertBefore(sidebar, document.body.firstChild);
        }

        sidebar.innerHTML = sidebarHTML;

        // Automatically close mobile drawer when any link inside sidebar is tapped
        sidebar.querySelectorAll('a.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    window.toggleMobileSidebar(false);
                }
            });
        });

        hydrateTopbars();
        syncUnreadChatCount();
        syncUnreadTicketCount();
        syncUnreadProjectCount();
        injectFloatingAiButton();

        // For non-super roles: async check if user has any project access
        injectProjectsLinkIfEligible();

        // Initialize real-time socket notifications
        initRealtimeNotifications();

        // If on dashboard and URL has tab parameter, auto activate that tab
        if (currentPage === 'dashboard.html' && activeTab) {
            setTimeout(() => {
                window.switchDashSection(activeTab);
            }, 50);
        }

        // Clear ticket badge when user visits tickets page
        if (currentPage === 'tickets.html') {
            markTicketNotificationsRead();
        }

        // Clear project badge when user visits projects page
        if (currentPage === 'projects.html' || currentPage === 'project-workspace.html') {
            markProjectNotificationsRead();
        }
    }

    // Mark ticket notifications as read when visiting tickets page
    async function markTicketNotificationsRead() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            // Fetch unread ticket notifications and mark them read
            const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const notifs = await res.json();
            const ticketNotifs = notifs.filter(n => n.type === 'TICKET' && !n.isRead);
            for (const n of ticketNotifs) {
                await fetch(`/api/notifications/${n.id}/read`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            updateBadge('sidebar-ticket-badge', 0);
        } catch (e) {}
    }

    // Mark project notifications as read when visiting projects page
    async function markProjectNotificationsRead() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            await fetch('/api/projects/mark-notifications-read', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            updateBadge('sidebar-projects-badge', 0);
        } catch (e) {}
    }

    // Periodic check for notifications across all pages
    setInterval(syncUnreadChatCount, 12000);
    setInterval(syncUnreadTicketCount, 15000);
    setInterval(syncUnreadProjectCount, 15000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderSidebar);
    } else {
        renderSidebar();
    }
})();
