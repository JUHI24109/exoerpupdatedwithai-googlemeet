(() => {
  // Sidebar rendering based on user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const links = [
    { href: 'dashboard.html', label: 'Dashboard', icon: 'fa-solid fa-house' },
    { href: 'employees.html', label: 'Employees', icon: 'fa-solid fa-users' },
    { href: 'attendance.html', label: 'Attendance', icon: 'fa-solid fa-user-check' },
    { href: 'tickets.html', label: 'Tickets', icon: 'fa-solid fa-ticket' },
    { href: 'chat.html', label: 'Chat', icon: 'fa-solid fa-message' },
    { href: 'meeting.html', label: 'Live Meeting', icon: 'fa-solid fa-video' },
    { href: 'documents.html', label: (['HR', 'HR Manager', 'CEO', 'Chairman', 'IT Admin'].includes(role) ? 'Documents' : 'My Documents'), icon: 'fa-solid fa-folder-open' },
    { href: 'history.html', label: 'History Center', icon: 'fa-solid fa-clock-rotate-left' },
    // role‑based link
    ...(['HR', 'HR Manager', 'CEO', 'Chairman', 'IT Admin'].includes(role) ? [{ href: 'undertakings.html', label: 'Undertakings', icon: 'fa-solid fa-handshake', id: 'navUndertakings' }] : []),
    { href: 'javascript:void(0)', label: 'Logout', icon: 'fa-solid fa-power-off', onClick: 'logout()' }
  ];

  const sidebarHTML = `
    <div class="logo">
      <img src="exologo.png" class="sidebar-logo" style="width:80px;height:80px;border-radius:10px;object-fit:contain;"/>
    </div>
    <nav>
      ${links.map(l => {
        const idAttr = l.id ? ` id="${l.id}"` : '';
        const onClick = l.onClick ? ` onclick="${l.onClick}"` : '';
        const style = l.label === 'Logout' ? ' style="color:var(--danger)"' : '';
        const iconHTML = l.icon.startsWith('<') ? l.icon : `<i class="${l.icon}"></i>`;
        return `<a href="${l.href}" class="nav-link"${idAttr}${onClick}${style}>${iconHTML} ${l.label}</a>`;
      }).join('')}
    </nav>
  `;

  const container = document.getElementById('sidebarContainer');
  if (container) container.innerHTML = sidebarHTML;
})();
