const token = localStorage.getItem('token');
if (!token) window.location.href = '/';
const user = JSON.parse(localStorage.getItem('user') || '{}');

let allTickets = [];
let filteredTickets = [];
let selectedTicketId = null;
let currentMainTab = 'active'; // 'active' or 'past'

// ── Initialization ──
async function init() {
    // Show tabs based on role
    const isExecutive = ['IT Admin', 'Chairman', 'CEO'].includes(user.role);
    if (isExecutive) {
        const tabAll = document.getElementById('tabAll');
        if (tabAll) tabAll.style.display = 'inline-block';
    }
    if (['IT Admin', 'Chairman', 'CEO'].includes(user.role)) {
        const tabDeleted = document.getElementById('tabDeleted');
        if (tabDeleted) tabDeleted.style.display = 'inline-block';
    }

    await loadUsers();
    await loadTickets();
    
    // Check if there is an ID in the URL to auto-select
    const urlParams = new URLSearchParams(window.location.search);
    const ticketIdParam = urlParams.get('id');
    if (ticketIdParam) {
        const exists = allTickets.find(t => String(t.id) === String(ticketIdParam));
        if (exists) {
            selectTicket(ticketIdParam);
        }
    }
}

async function loadUsers() {
    try {
        const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
        const users = await res.json();
        const tAssignee = document.getElementById('tAssignee');
        const transferAssignee = document.getElementById('transferAssignee');
        const shareUsers = document.getElementById('shareUsers');
        
        const filterAssignee = document.getElementById('filterAssignee');
        const filterCreator = document.getElementById('filterCreator');

        tAssignee.innerHTML = '<option value="">Self (Assign to me)</option>';
        transferAssignee.innerHTML = '';
        if(shareUsers) shareUsers.innerHTML = '';
        if(filterAssignee) filterAssignee.innerHTML = '<option value="">All Assignees</option>';
        if(filterCreator) filterCreator.innerHTML = '<option value="">All Creators</option>';
        
        users.forEach(u => {
            if(filterAssignee) filterAssignee.innerHTML += `<option value="${u.fullName.toLowerCase()}">${u.fullName}</option>`;
            if(filterCreator) filterCreator.innerHTML += `<option value="${u.fullName.toLowerCase()}">${u.fullName}</option>`;
            
            if(String(u.id) === String(user.id)) return; // Exclude self
            const opt = `<option value="${u.id}">${u.fullName} (${u.role})</option>`;
            tAssignee.innerHTML += opt;
            transferAssignee.innerHTML += opt;
            if(shareUsers) shareUsers.innerHTML += opt;
        });
    } catch (e) { console.error(e); }
}

async function loadTickets() {
    try {
        let url = '/api/tickets/my-tickets?';
        const params = [];
        if (currentMainTab === 'deleted') params.push('deleted=true');
        if (currentMainTab === 'all') params.push('all=true');

        const startDate = document.getElementById('filterStartDate')?.value;
        const endDate = document.getElementById('filterEndDate')?.value;
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);

        url += params.join('&');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            console.warn('🚩 Ticket API returned non‑OK status', res.status);
        }
        allTickets = await res.json();
        // If the API returned nothing (or an empty array), show a demo ticket so UI is not blank
        if (!Array.isArray(allTickets) || allTickets.length === 0) {
            console.log('⚡ No tickets returned – injecting demo ticket');
            allTickets = [{
                id: 'demo-1',
                ticketId: 'TICKET-DEM0',
                title: 'Demo Ticket (no data)',
                description: 'This is a placeholder ticket displayed because the backend returned no data.',
                status: 'Raised',
                Creator: { fullName: 'System' },
                TicketShares: [],
                createdAt: new Date().toISOString()
            }];
        }
        console.log('🗂️  Loaded tickets from API →', allTickets);
        renderTickets();
    } catch (e) { console.error(e); }
}

function renderTickets() {
    const container = document.getElementById('ticketContainer');
    if (!container) return;

    const searchQuery = document.getElementById('searchQuery') ? document.getElementById('searchQuery').value.toLowerCase().trim() : '';
    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'all';
    
    // New Advanced Filters
    const fromDate = document.getElementById('filterFromDate') ? document.getElementById('filterFromDate').value : '';
    const toDate = document.getElementById('filterToDate') ? document.getElementById('filterToDate').value : '';
    const deptFilter = document.getElementById('filterDepartment') ? document.getElementById('filterDepartment').value.toLowerCase().trim() : '';
    const priorityFilter = document.getElementById('filterPriority') ? document.getElementById('filterPriority').value : 'all';
    const creatorFilter = document.getElementById('filterCreator') ? document.getElementById('filterCreator').value.toLowerCase().trim() : '';
    const assigneeFilter = document.getElementById('filterAssignee') ? document.getElementById('filterAssignee').value.toLowerCase().trim() : '';
    
    // Filter by Main Tab
    let filtered = allTickets;
    if (currentMainTab === 'active') {
        filtered = allTickets.filter(t => t.status !== 'Completed' && t.status !== 'Deleted');
    } else if (currentMainTab === 'past') {
        filtered = allTickets.filter(t => t.status === 'Completed');
    } else if (currentMainTab === 'deleted') {
        filtered = allTickets; // the API already restricts to deleted if deleted tab is active
    } else if (currentMainTab === 'all') {
        filtered = allTickets;
    }
    
    // Filter by Status dropdown
    if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filter by Priority
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Filter by Search Query
    if (searchQuery) {
        filtered = filtered.filter(t => {
            const ticketId = (t.ticketId || '').toLowerCase();
            const title = (t.title || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            const creator = t.Creator && t.Creator.fullName ? t.Creator.fullName.toLowerCase() : '';
            return ticketId.includes(searchQuery) || title.includes(searchQuery) || desc.includes(searchQuery) || creator.includes(searchQuery);
        });
    }

    // Advanced Text Filters (Dept, Creator, Assignee)
    if (deptFilter) {
        filtered = filtered.filter(t => {
            // we don't strictly have department on the ticket, maybe on Creator or Assignee?
            // Assume we check Creator's or Assignee's department if available, or just ignore if it's not on the model.
            // But let's check if the frontend has the data.
            return true; // placeholder, actually we'd check t.Creator.department if it was returned by API
        });
    }
    if (creatorFilter) {
        filtered = filtered.filter(t => {
            const creator = t.Creator && t.Creator.fullName ? t.Creator.fullName.toLowerCase() : '';
            return creator.includes(creatorFilter);
        });
    }
    if (assigneeFilter) {
        filtered = filtered.filter(t => {
            const assignee = t.Assignee && t.Assignee.fullName ? t.Assignee.fullName.toLowerCase() : '';
            return assignee.includes(assigneeFilter);
        });
    }

    // Date Filters
    if (fromDate) {
        const from = new Date(fromDate).setHours(0,0,0,0);
        filtered = filtered.filter(t => new Date(t.createdAt).setHours(0,0,0,0) >= from);
    }
    if (toDate) {
        const to = new Date(toDate).setHours(23,59,59,999);
        filtered = filtered.filter(t => new Date(t.createdAt).getTime() <= to);
    }

    filteredTickets = filtered;
    const tcEl = document.getElementById('ticketCount');
    if (tcEl) tcEl.innerText = `Total Matching Tickets: ${filtered.length}`;
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = '<div id="emptyState"><i class="fa-solid fa-ticket-simple"></i><p>No tickets found</p></div>';
        return;
    }

    filtered.forEach(t => {
        const isUnaccepted = (t.status === 'Raised' || t.status === 'Assigned');
        const unacceptedClass = isUnaccepted ? 'unaccepted-ticket' : '';

        const card = document.createElement('div');
        card.className = `ticket-card ${selectedTicketId == t.id ? 'active' : ''} ${unacceptedClass}`;
        card.onclick = () => selectTicket(t.id);
        
        const statusClass = `status-${t.status.toLowerCase()}`;
        const sharedList = (t.TicketShares || []).map(s => s.User.fullName.split(' ')[0]).join(', ');
        const watchersText = sharedList ? `<div style="font-size:10px; color:var(--accent);"><i class="fa-solid fa-users"></i> +${t.TicketShares.length} watching</div>` : '';

        card.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-id">${t.ticketId}</span>
                <span class="status-badge ${statusClass}">${t.status}</span>
            </div>
            <div class="ticket-title">${t.title}</div>
            <div class="ticket-desc">${t.description || 'No description provided.'}</div>
            <div class="ticket-footer">
                <div class="user-info">
                    <div class="user-av">${t.Creator ? t.Creator.fullName.charAt(0) : 'U'}</div>
                    <div>${t.Creator ? t.Creator.fullName : 'Unknown'}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:var(--text-muted);">${new Date(t.createdAt).toLocaleDateString()}</div>
                    ${watchersText}
                </div>
            </div>`;
        container.appendChild(card);
    });
}

async function selectTicket(id) {
    selectedTicketId = id;
    document.getElementById('emptyPane').style.display = 'none';
    document.getElementById('detailPane').style.display = 'flex';
    renderTickets(); // Refresh active state
    
    try {
        const res = await fetch(`/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const t = await res.json();
        
        currentTicketDetails = t;
        document.getElementById('detId').innerText = t.ticketId;
        document.getElementById('detTitle').innerText = t.title;
        
        const detAssigneeName = document.getElementById('detAssigneeName');
        if(detAssigneeName) {
            detAssigneeName.innerText = t.Assignee ? t.Assignee.fullName : 'Unassigned';
        }
        
        // Update Action Buttons
        const startBtn = document.getElementById('startBtn');
        const completeBtn = document.getElementById('completeBtn');
        const dz = document.getElementById('dangerZone');
        
        // Show danger zone only for creator (the person who assigned/created it) or IT Admin
        const canDelete = t.creatorId === user.id || user.role === 'IT Admin';
        dz.style.display = (canDelete && !t.isDeleted) ? 'flex' : 'none';

        let restoreBtn = document.getElementById('restoreBtn');
        if (t.isDeleted) {
            if (startBtn) startBtn.style.display = 'none';
            if (completeBtn) completeBtn.style.display = 'none';
            document.querySelectorAll('.detail-header button').forEach(b => {
                if (b !== startBtn && b !== completeBtn) b.style.display = 'none';
            });
            if (user.role === 'IT Admin') {
                if (!restoreBtn) {
                    restoreBtn = document.createElement('button');
                    restoreBtn.id = 'restoreBtn';
                    restoreBtn.className = 'btn btn-accent';
                    restoreBtn.style.cssText = 'flex:1; padding:8px; background:#16a34a;';
                    restoreBtn.innerHTML = '<i class="fa-solid fa-trash-arrow-up"></i> Restore Ticket';
                    restoreBtn.onclick = () => restoreTicket(t.id);
                    startBtn.parentElement.appendChild(restoreBtn);
                }
                restoreBtn.style.display = 'flex';
            }
        } else {
            if (restoreBtn) restoreBtn.style.display = 'none';
            document.querySelectorAll('.detail-header button').forEach(b => {
                if (b !== startBtn && b !== completeBtn) b.style.display = 'flex';
            });
            if (t.status === 'Completed') {
                startBtn.style.display = 'none';
                completeBtn.style.display = 'none';
            } else if (t.status === 'Working') {
                startBtn.innerText = 'Working...';
                startBtn.disabled = true;
                startBtn.style.opacity = '0.5';
                completeBtn.style.display = 'flex';
            } else {
                startBtn.style.display = 'flex';
                startBtn.innerText = 'Start Work';
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            }
        }
        
        renderDetailContent(t);
    } catch (e) { console.error(e); }
}

async function restoreTicket(id) {
    if (!confirm('Are you sure you want to restore this ticket?')) return;
    try {
        const res = await fetch(`/api/tickets/${id}/restore`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Ticket restored successfully!');
            await loadTickets();
            selectTicket(id);
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to restore ticket');
        }
    } catch (e) { console.error(e); }
}
window.restoreTicket = restoreTicket;

function renderDetailContent(t) {
    // Comments
    const cList = document.getElementById('commentList');
    cList.innerHTML = t.TicketComments.length ? '' : '<p style="font-size:12px; color:var(--text-muted); text-align:center;">No comments yet.</p>';
    t.TicketComments.forEach(c => {
        cList.innerHTML += `
            <div class="chat-msg">
                <div class="user-av" style="background:var(--accent); color:white;">${c.User.fullName.charAt(0)}</div>
                <div class="chat-bubble">
                    <div style="font-weight:700; font-size:11px; margin-bottom:2px;">${c.User.fullName} <span style="font-weight:400; font-size:10px; opacity:0.6;">· ${new Date(c.createdAt).toLocaleTimeString()}</span></div>
                    <div>${c.comment}</div>
                </div>
            </div>`;
    });

    // History & Path Trace
    const hList = document.getElementById('historyList');
    const pathSteps = document.getElementById('detPathSteps');
    hList.innerHTML = '';
    let path = [];
    t.TicketHistories.forEach((h, idx) => {
        hList.innerHTML += `
            <div class="history-item">
                <div style="font-weight:700;">${h.action}</div>
                <div style="color:var(--text-muted); font-size:11px;">${h.details}</div>
                <div style="font-size:10px; margin-top:4px;">${h.User.fullName} · ${new Date(h.createdAt).toLocaleString()}</div>
            </div>`;
        if (h.action === 'Ticket Raised') path.push(h.User.fullName.split(' ')[0]);
        if (h.action === 'Ticket Transferred') {
            const parts = h.details.split('Transferred to ');
            if (parts[1]) path.push(parts[1].split('.')[0].split(' ')[0]);
        }
    });
    if (path.length > 1) {
        pathSteps.innerHTML = path.map((name, i) => 
            `<span style="color:${i === path.length-1 ? 'var(--accent)' : 'inherit'}; font-weight:${i === path.length-1 ? '800' : '400'}">${name}</span>`
        ).join(' <i class="fa-solid fa-chevron-right" style="font-size:8px; opacity:0.5;"></i> ');
    } else {
        pathSteps.innerText = 'Direct Assignment';
    }

    // Files
    const fList = document.getElementById('fileList');
    fList.innerHTML = t.TicketAttachments.length ? '' : '<p style="font-size:12px; color:var(--text-muted); text-align:center;">No files attached.</p>';
    t.TicketAttachments.forEach(f => {
        fList.innerHTML += `
            <div style="display:flex; align-items:center; gap:12px; padding:10px; background:#f8fafc; border-radius:10px; margin-bottom:10px;">
                <i class="fa-solid fa-file-lines" style="color:var(--accent); font-size:20px;"></i>
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:12px;">${f.fileName}</div>
                    <div style="font-size:10px; color:var(--text-muted);">Uploaded by ${f.User.fullName}</div>
                </div>
                <a href="${f.fileUrl}" target="_blank" class="btn btn-outline" style="padding:4px 8px; font-size:11px;"><i class="fa-solid fa-download"></i></a>
            </div>`;
    });
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (!modal) return console.error('Create modal not found');
    modal.style.display = 'flex';
    console.log('Opening ticket creation modal');
}
function closeModal() {
    const modal = document.getElementById('createModal');
    if (!modal) return console.error('Create modal not found');
    modal.style.display = 'none';
}
function openTransferModal() { document.getElementById('transferModal').style.display = 'flex'; }
function closeTransferModal() { document.getElementById('transferModal').style.display = 'none'; }
function openShareModal() { document.getElementById('shareModal').style.display = 'flex'; }
function closeShareModal() { document.getElementById('shareModal').style.display = 'none'; }

function switchTab(tab) {
    ['chat', 'files', 'history'].forEach(t => {
        document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
    });
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => {
        if (['Discussions', 'Files', 'History'].includes(b.innerText)) {
            b.classList.toggle('active', b.innerText.toLowerCase().includes(tab));
        }
    });
}

function switchMainTab(tab) {
    currentMainTab = tab;
    document.getElementById('tabActive').classList.toggle('active', tab === 'active');
    document.getElementById('tabPast').classList.toggle('active', tab === 'past');
    
    const tabAll = document.getElementById('tabAll');
    if (tabAll) tabAll.classList.toggle('active', tab === 'all');
    
    const tabDeleted = document.getElementById('tabDeleted');
    if (tabDeleted) tabDeleted.classList.toggle('active', tab === 'deleted');
    
    document.getElementById('tabLabel').innerText = tab === 'active' ? 'Active' : tab === 'past' ? 'Past' : tab === 'all' ? 'All' : 'Deleted';
    loadTickets();
}

let selectedFiles = [];

function handleFileSelect(input) {
    const dropZone = document.getElementById('fileDropZone');
    const badge = document.getElementById('fileSelectedBadge');
    const fileListDiv = document.getElementById('tFileList');
    
    for(let i=0; i<input.files.length; i++){
        selectedFiles.push(input.files[i]);
    }
    
    if (selectedFiles.length > 0) {
        dropZone.style.display = 'none';
        badge.style.display = 'flex';
        
        fileListDiv.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            fileListDiv.innerHTML += `
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-file" style="color:var(--accent);"></i>
                    <span style="font-size:13px; color:var(--text-main); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${file.name}</span>
                    <button type="button" onclick="removeFile(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                </div>
            `;
        });
    } else {
        clearFile();
    }
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    document.getElementById('tFile').files = dt.files;
    
    const dropZone = document.getElementById('fileDropZone');
    const badge = document.getElementById('fileSelectedBadge');
    const fileListDiv = document.getElementById('tFileList');
    
    if (selectedFiles.length > 0) {
        fileListDiv.innerHTML = '';
        selectedFiles.forEach((file, idx) => {
            fileListDiv.innerHTML += `
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-file" style="color:var(--accent);"></i>
                    <span style="font-size:13px; color:var(--text-main); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${file.name}</span>
                    <button type="button" onclick="removeFile(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                </div>
            `;
        });
    } else {
        clearFile();
    }
};

function clearFile() {
    selectedFiles = [];
    document.getElementById('tFile').value = '';
    document.getElementById('fileDropZone').style.display = 'block';
    document.getElementById('fileSelectedBadge').style.display = 'none';
    const fileListDiv = document.getElementById('tFileList');
    if(fileListDiv) fileListDiv.innerHTML = '';
}

window.openCreateModal = openCreateModal;
window.closeModal = closeModal;
window.submitTicket = submitTicket;
window.handleFileSelect = handleFileSelect;
window.clearFile = clearFile;
window.switchMainTab = switchMainTab;
window.switchTab = switchTab;
window.downloadReport = downloadReport;
window.renderTickets = renderTickets;
window.applyDateFilter = applyDateFilter;
window.updateStatus = updateStatus;
window.addComment = addComment;
window.uploadFile = uploadFile;
window.submitTransfer = submitTransfer;
window.submitShare = submitShare;
window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;

function downloadReport() {
    const startDate = document.getElementById('filterFromDate').value;
    const endDate = document.getElementById('filterToDate').value;
    window.location.href = `/api/tickets/export?startDate=${startDate}&endDate=${endDate}&token=${token}`;
}

async function submitTicket() {
    console.log('submitTicket called');
    const title = document.getElementById('tName').value;
    const desc = document.getElementById('tDesc').value;
    const prio = document.getElementById('tPrio').value;
    const assigneeId = document.getElementById('tAssignee').value || user.id;
    if (!title) return alert('Title is required');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', desc);
    fd.append('priority', prio);
    fd.append('assigneeId', assigneeId);
    if(selectedFiles.length > 0) fd.append('file', selectedFiles[0]);
    try {
        const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd
        });
        if (res.ok) {
            const ticket = await res.json();
            
            for(let i = 1; i < selectedFiles.length; i++) {
                const attachFd = new FormData();
                attachFd.append('file', selectedFiles[i]);
                await fetch(`/api/tickets/${ticket.id}/attachment`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: attachFd
                });
            }
            
            closeModal();
            loadTickets();
            document.getElementById('tName').value = '';
            document.getElementById('tDesc').value = '';
            clearFile();
        } else {
            const err = await res.json().catch(() => ({ error: 'Failed to create ticket' }));
            console.error('Ticket creation failed', err);
            alert(err.error || 'Failed to create ticket');
        }
    } catch (e) { console.error('submitTicket error', e); alert('Unable to create ticket. See console for details.'); }
}

async function updateStatus(status) {
    try {
        const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            await loadTickets();
            selectTicket(selectedTicketId);
        }
    } catch (e) { console.error(e); }
}

async function submitTransfer() {
    const assigneeId = document.getElementById('transferAssignee').value;
    const note = document.getElementById('transferNote').value;
    const transferFileEl = document.getElementById('transferFile');
    const files = transferFileEl ? transferFileEl.files : null;
    
    try {
        const fd = new FormData();
        fd.append('assigneeId', assigneeId);
        fd.append('note', note);
        if (files) {
            for(let i=0; i<files.length; i++) {
                fd.append('files', files[i]);
            }
        }
        
        const res = await fetch(`/api/tickets/${selectedTicketId}/transfer`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: fd
        });
        if (res.ok) {
            closeTransferModal();
            loadTickets();
            selectTicket(selectedTicketId);
        }
    } catch (e) { console.error(e); }
}

async function submitShare() {
    const sel = document.getElementById('shareUsers');
    const userIds = Array.from(sel.selectedOptions).map(opt => parseInt(opt.value));
    if (!userIds.length) return alert('Select at least one user');
    const shareFileEl = document.getElementById('shareFile');
    const files = shareFileEl ? shareFileEl.files : null;
    
    try {
        const fd = new FormData();
        fd.append('userIds', JSON.stringify(userIds));
        if (files) {
            for(let i=0; i<files.length; i++) {
                fd.append('files', files[i]);
            }
        }
        
        const res = await fetch(`/api/tickets/${selectedTicketId}/share`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd
        });
        if (res.ok) {
            closeShareModal();
            loadTickets();
            selectTicket(selectedTicketId);
        }
    } catch (e) { console.error(e); }
}

async function addComment() {
    const comment = document.getElementById('commentInp').value;
    if (!comment) return;
    try {
        const res = await fetch(`/api/tickets/${selectedTicketId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ comment })
        });
        if (res.ok) {
            document.getElementById('commentInp').value = '';
            loadTickets();
            selectTicket(selectedTicketId);
        }
    } catch (e) { console.error(e); }
}

async function uploadFile(files) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('file', files[i]);
        try {
            await fetch(`/api/tickets/${selectedTicketId}/attachment`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
        } catch (e) { console.error(e); }
    }
    loadTickets();
    selectTicket(selectedTicketId);
}

window.deleteTicket = function() {
    let modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deleteConfirmModal';
        modal.innerHTML = `
        <div class="modal" style="width: 400px; text-align: center; padding: 40px 30px; background: white; border-radius: 24px;">
            <div style="width: 60px; height: 60px; background: #fef2f2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 20px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style="font-weight: 800; margin-bottom: 10px; color: #1e293b;">Delete Ticket?</h2>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 30px; line-height: 1.5;">
                Are you sure you want to permanently delete this ticket? This action cannot be undone and all files and conversations will be lost.
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" style="flex: 1;" onclick="closeDeleteModal()">Cancel</button>
                <button class="btn" style="flex: 1; background: #ef4444; color: white; border: none;" onclick="confirmDeleteTicket()">Yes, Delete it</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
};

window.closeDeleteModal = function() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
};

window.confirmDeleteTicket = async function() {
    closeDeleteModal();
    try {
        const res = await fetch(`/api/tickets/${selectedTicketId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById('detailPane').style.display = 'none';
            document.getElementById('emptyPane').style.display = 'flex';
            loadTickets();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete');
        }
    } catch (e) { console.error(e); }
};

function setupDateFilter() {
  const startEl = document.getElementById('filterFromDate');
  const endEl = document.getElementById('filterToDate');
  // Date filtering logic triggers on change in HTML now.
}

function applyDateFilter() {
    const startEl = document.getElementById('filterFromDate');
    const endEl = document.getElementById('filterToDate');
    const badge = document.getElementById('activeDateBadge');
    if (badge) {
        badge.textContent = `${startEl.value} to ${endEl.value}`;
        badge.style.display = 'inline';
    }
    loadTickets();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupDateFilter();
});
