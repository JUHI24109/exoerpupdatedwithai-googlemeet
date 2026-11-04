/**
 * EXO GLOBAL ERP — WhatsApp Style Chat System
 * ULTIMATE ROBUST VERSION 5.0
 */

console.log('🚀 Chat Script v5.0 Initializing...');

const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');

// Fallback if employeeId is missing from old session
if (token && !user.employeeId) {
    console.warn('⚠️ employeeId missing, fetching profile...');
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(u => {
            user = { ...user, employeeId: u.employeeId };
            localStorage.setItem('user', JSON.stringify(user));
            console.log('✅ Profile synced');
        });
}

if (!token || !user.id) {
    console.warn('⚠️ No token or user ID found. Redirecting to login...');
    window.location.href = '/';
}

const socket = io({ path: '/api/socket.io', transports: ['polling'] });
if (Notification.permission === 'default') {
    Notification.requestPermission();
}
let activeChatId = null;
let allUsers = [];
let myGroups = [];
let unreadCounts = {}; 
let lastMessages = {}; 
let selectedGroupMembers = [];

// Static Groups
const staticGroups = [
    { id: 'group-professional', fullName: '🏢 EXO Official', role: 'Official Company Updates' },
    { id: 'group-employees', fullName: '👥 EXO Employees', role: 'All Employee Discussions' },
    { id: 'group-casual', fullName: '🌴 EXO Casual', role: 'Fun & General Talk' }
];

// Socket join
socket.emit('join', user.employeeId || user.id);

// UI Initialization
document.addEventListener('DOMContentLoaded', () => {
    const meAv = document.getElementById('meAv');
    if (meAv && user.name) {
        meAv.innerText = user.name.charAt(0);
    }
    
    // Setup Listeners
    setupListeners();
    
    // Initial Load
    loadAllData();
});

function setupListeners() {
    const sInp = document.getElementById('userSearch');
    if (sInp) sInp.oninput = renderUserList;

    const mInp = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('micBtn');

    if (mInp) {
        mInp.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };
        mInp.oninput = () => {
            if (mInp.value.trim().length > 0) {
                sendBtn.style.display = 'flex';
                micBtn.style.display = 'none';
            } else {
                sendBtn.style.display = 'none';
                micBtn.style.display = 'flex';
            }
        };
    }

    if (sendBtn) sendBtn.onclick = sendMessage;

    // File Upload Listeners
    const imgInp = document.getElementById('fileUploadImg');
    const docInp = document.getElementById('fileUploadDoc');
    if (imgInp) imgInp.onchange = e => handleFileUpload(e.target.files[0]);
    if (docInp) docInp.onchange = e => handleFileUpload(e.target.files[0]);

    const newGroupBtn = document.getElementById('newGroupBtn');
    if (newGroupBtn) newGroupBtn.onclick = openGroupModal;

    const memberSearch = document.getElementById('memberSearch');
    if (memberSearch) memberSearch.oninput = filterMembers;

    // Attach Menu
    const attachBtn = document.getElementById('attachBtn');
    const attachWrapper = document.getElementById('attachWrapper');
    if (attachBtn) {
        attachBtn.onclick = (e) => {
            e.stopPropagation();
            attachWrapper.classList.toggle('active');
        };
    }
    document.addEventListener('click', () => {
        if (attachWrapper) attachWrapper.classList.remove('active');
    });
}

async function loadAllData() {
    try {
        await Promise.all([loadUsers(), loadGroups(), loadConversationsData()]);
        renderUserList();
    } catch (err) {
        console.error('Data load error:', err);
    }
}

async function loadConversationsData() {
    try {
        const res = await fetch('/api/chat/conversations', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        if (data.lastMessages) lastMessages = data.lastMessages;
        if (data.unreadCounts) unreadCounts = data.unreadCounts;
    } catch (err) { 
        console.error('Conversations load failed', err);
        // Fallback to unread endpoint
        try {
            const res2 = await fetch('/api/chat/unread', { headers: { Authorization: `Bearer ${token}` } });
            const data2 = await res2.json();
            unreadCounts = data2.counts || data2 || {};
        } catch (e) {}
    }
}

async function loadUsers() {
    try {
        const res = await fetch('/api/auth/users', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const apiUsers = await res.json();
        allUsers = Array.isArray(apiUsers) ? apiUsers.filter(u => String(u.employeeId) !== String(user.employeeId)) : [];
    } catch (err) { console.error('Users load failed', err); }
}

async function loadGroups() {
    try {
        const res = await fetch('/api/chat/my-groups', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const apiGroups = await res.json();
        myGroups = Array.isArray(apiGroups) ? apiGroups.map(g => ({ ...g, fullName: g.name, id: g.id, isDynamic: true })) : [];
    } catch (err) { console.error('Groups load failed', err); }
}

function renderUserList() {
    const list = document.getElementById('usersList');
    if (!list) return;
    
    list.innerHTML = '';
    const q = (document.getElementById('userSearch')?.value || '').toLowerCase();

    // Combine All for unified sorting
    const combinedGroups = [...staticGroups, ...myGroups].map(g => ({ ...g, isGroup: true, id: g.id, name: g.fullName }));
    const combinedDms = allUsers.map(u => ({ ...u, isGroup: false, id: u.employeeId, name: u.fullName }));
    
    let items = [...combinedGroups, ...combinedDms];

    // Filter
    items = items.filter(i => i.name.toLowerCase().includes(q));

    // WhatsApp style sorting: unread messages ALWAYS jump to top, then sorted by latest message
    items.sort((a, b) => {
        const unreadA = (unreadCounts[a.id] || 0) > 0 ? 1 : 0;
        const unreadB = (unreadCounts[b.id] || 0) > 0 ? 1 : 0;
        if (unreadB !== unreadA) {
            return unreadB - unreadA; // Any chat with unread ALWAYS on top!
        }
        const timeA = lastMessages[a.id]?.time || 0;
        const timeB = lastMessages[b.id]?.time || 0;
        return timeB - timeA;
    });

    if (items.length === 0) {
        list.innerHTML = '<div style="padding:40px 20px; text-align:center; color:var(--wa-muted); font-size:14px;">No conversations found</div>';
        return;
    }

    items.forEach(item => renderItem(item, list, item.isGroup));
}

function appendSectionHeader(list, text, showPlus) {
    const div = document.createElement('div');
    div.className = 'section-header';
    div.innerHTML = `<span>${text}</span> ${showPlus ? '<i class="fa-solid fa-plus" onclick="openGroupModal()" title="New Group"></i>' : ''}`;
    list.appendChild(div);
}

function renderItem(u, list, isGroup) {
    const item = document.createElement('div');
    const id = u.id || u.employeeId;
    
    let avText = u.name ? u.name.charAt(0) : (u.fullName ? u.fullName.charAt(0) : '?');
    let avBg = isGroup ? '#00a884' : '#6366f1';

    if (id === 'group-professional') avText = '<i class="fa-solid fa-bullhorn"></i>';
    if (id === 'group-employees') avText = '<i class="fa-solid fa-users"></i>';
    if (id === 'group-casual') avText = '<i class="fa-solid fa-mug-hot"></i>';

    const last = lastMessages[id] || {};
    const unread = unreadCounts[id] || 0;
    const isUnread = unread > 0 && activeChatId !== id;
    const timeStr = last.time ? new Date(last.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

    item.className = `user-item ${activeChatId === id ? 'active' : ''} ${isUnread ? 'unread' : ''}`;
    
    if (isUnread) {
        item.style.backgroundColor = '#f0fdf4';
        item.style.borderLeft = '4px solid #25D366';
    } else {
        item.style.borderLeft = 'none';
        if (activeChatId !== id) item.style.backgroundColor = '';
    }

    item.innerHTML = `
        <div class="u-av" style="background:${avBg}; position:relative;">
            ${avText}
            ${isUnread ? '<span style="position:absolute; bottom:2px; right:2px; width:10px; height:10px; background:#25D366; border-radius:50%; border:2px solid white;"></span>' : ''}
        </div>
        <div class="u-info">
            <div class="u-name-row">
                <span class="u-name" style="${isUnread ? 'font-weight:700; color:#0f172a;' : ''}">${u.name || u.fullName}</span>
                <span class="u-time" style="${isUnread ? 'color:#25D366; font-weight:700;' : ''}">${timeStr}</span>
            </div>
            <div class="u-last-msg-row">
                <span class="u-last-msg" style="${isUnread ? 'color:#1e293b; font-weight:600;' : ''}">${last.content || u.role || u.department || 'Click to message'}</span>
                ${unread > 0 ? `<span class="unread-wa-badge" style="background:#25D366; color:#ffffff; font-size:11px; font-weight:800; min-width:20px; height:20px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; padding: 0 6px; box-shadow:0 2px 5px rgba(37,211,102,0.45); margin-left:6px;">${unread}</span>` : ''}
            </div>
        </div>
    `;
    item.onclick = () => {
        unreadCounts[id] = 0;
        selectUser(id, u.name || u.fullName, u.role || u.department);
        renderUserList(); 
    };
    list.appendChild(item);
}

window.mobileBackToChatList = function() {
    const container = document.querySelector('.app-container');
    if (container) {
        container.classList.remove('mobile-chat-open');
    }
    activeChatId = null;
    const intro = document.getElementById('chatIntro');
    const iface = document.getElementById('chatInterface');
    if (window.innerWidth <= 992) {
        if (intro) intro.style.display = 'none';
        if (iface) iface.style.display = 'none';
    } else {
        if (intro) intro.style.display = 'flex';
        if (iface) iface.style.display = 'none';
    }
};

function selectUser(id, name, status) {
    activeChatId = id;
    const container = document.querySelector('.app-container');
    if (container) {
        container.classList.add('mobile-chat-open');
    }
    document.getElementById('chatIntro').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'flex';
    document.getElementById('headerName').innerText = name;
    document.getElementById('headerStatus').innerText = status || 'online';
    
    const hAv = document.getElementById('headerAv');
    hAv.innerText = name.charAt(0);
    hAv.style.background = String(id).includes('group') || String(id).length > 20 ? '#00a884' : '#6366f1';

    // Mark messages as read
    const uId = user.employeeId || user.id;
    socket.emit('mark_read', { otherId: id, userId: uId });

    renderUserList();
    loadHistory(id);
}

async function loadHistory(id) {
    try {
        const uId = user.employeeId || user.id;
        const res = await fetch(`/api/chat/history/${uId}/${id}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const msgs = await res.json();
        const mList = document.getElementById('messagesList');
        mList.innerHTML = '';
        msgs.forEach(appendMessage);
        mList.scrollTop = mList.scrollHeight;
    } catch (e) { console.error('❌ History fetch failed', e); }
}

function appendMessage(msg) {
    const isMe = String(msg.senderId) === String(user.employeeId || user.id);
    const row = document.createElement('div');
    row.className = `msg-row ${isMe ? 'me' : 'them'}`;
    
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const isGroupChat = String(activeChatId).startsWith('group-') || String(activeChatId).length > 20;

    let contentHtml = `<div class="bubble-content">${msg.content || ''}</div>`;
    
    // Handle Files
    if (msg.fileUrl) {
        if (msg.fileType && msg.fileType.startsWith('image/')) {
            contentHtml = `<img src="${msg.fileUrl}" style="max-width:100%; border-radius:8px; margin-bottom:5px; cursor:pointer;" onclick="window.open('${msg.fileUrl}')">`;
        } else {
            contentHtml = `<a href="${msg.fileUrl}" target="_blank" style="display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;">
                <i class="fa-solid fa-file-lines" style="font-size:24px; color:#5157ae;"></i>
                <div style="overflow:hidden;">
                    <div style="font-size:13px; font-weight:600; white-space:nowrap; text-overflow:ellipsis;">${msg.fileName || 'Document'}</div>
                    <div style="font-size:11px; color:#667781;">Click to view</div>
                </div>
            </a>`;
        }
        if (msg.content) contentHtml += `<div class="bubble-content" style="margin-top:5px;">${msg.content}</div>`;
    }

    row.innerHTML = `
        <div class="bubble">
            ${(!isMe && isGroupChat) ? `<span class="bubble-sender">${msg.Sender?.fullName || 'User'}</span>` : ''}
            ${contentHtml}
            <div class="time-wrapper">
                <span class="time">${time}</span>
                ${isMe ? `<span class="tick ${msg.isRead ? 'read' : 'sent'}"><i class="fa-solid fa-check-double"></i></span>` : ''}
            </div>
        </div>
    `;
    document.getElementById('messagesList').appendChild(row);
    const mList = document.getElementById('messagesList');
    mList.scrollTop = mList.scrollHeight;
}

async function handleFileUpload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log('📤 Uploading file:', file.name);
        const res = await fetch('/api/chat/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            sendFileMessage(data);
        } else {
            alert('File upload failed');
        }
    } catch (err) { console.error('Upload error:', err); }
}

function sendFileMessage(fileData) {
    const senderId = user.employeeId || user.id;
    socket.emit('send_message', {
        senderId,
        receiverId: activeChatId,
        fileUrl: fileData.url,
        fileType: fileData.type,
        fileName: fileData.name
    });
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim() || !activeChatId) return;
    
    const content = input.value.trim();
    const senderId = user.employeeId || user.id; // Robust ID fallback

    socket.emit('send_message', { 
        senderId, 
        receiverId: activeChatId, 
        content 
    });
    
    input.value = '';
    // Reset buttons to mic
    document.getElementById('sendBtn').style.display = 'none';
    document.getElementById('micBtn').style.display = 'flex';
}

// ── Recording UI Toggles (For future use) ──
function toggleRecordingUI(show) {
    const vUI = document.getElementById('voiceUI');
    const tInp = document.getElementById('textInputContainer');
    if (show) {
        vUI.style.display = 'flex';
        tInp.style.display = 'none';
    } else {
        vUI.style.display = 'none';
        tInp.style.display = 'flex';
    }
}

// ── Group Management ──
function openGroupModal() {
    document.getElementById('groupModal').style.display = 'flex';
    selectedGroupMembers = [];
    renderSelectedMembers();
}

function closeGroupModal() {
    document.getElementById('groupModal').style.display = 'none';
}

function filterMembers() {
    const q = document.getElementById('memberSearch').value.toLowerCase();
    const results = document.getElementById('memberSearchResults');
    if (!q) { results.style.display = 'none'; return; }

    const filtered = allUsers.filter(u => u.fullName.toLowerCase().includes(q) && !selectedGroupMembers.find(m => m.employeeId === u.employeeId));
    
    results.innerHTML = '';
    if (filtered.length > 0) {
        results.style.display = 'block';
        filtered.forEach(u => {
            const div = document.createElement('div');
            div.className = 'attach-item';
            div.innerHTML = `<div class="u-av" style="width:30px; height:30px; font-size:12px; margin-right:10px; background:#6366f1;">${u.fullName.charAt(0)}</div> ${u.fullName}`;
            div.onclick = () => addMember(u);
            results.appendChild(div);
        });
    } else {
        results.style.display = 'none';
    }
}

function addMember(u) {
    selectedGroupMembers.push(u);
    document.getElementById('memberSearch').value = '';
    document.getElementById('memberSearchResults').style.display = 'none';
    renderSelectedMembers();
}

function removeMember(eid) {
    selectedGroupMembers = selectedGroupMembers.filter(m => m.employeeId !== eid);
    renderSelectedMembers();
}

function renderSelectedMembers() {
    const container = document.getElementById('selectedMembers');
    container.innerHTML = '';
    selectedGroupMembers.forEach(m => {
        const chip = document.createElement('span');
        chip.className = 'member-chip';
        chip.innerHTML = `${m.fullName} <i class="fa-solid fa-xmark" onclick="removeMember('${m.employeeId}')"></i>`;
        container.appendChild(chip);
    });
}

async function createGroup() {
    const name = document.getElementById('groupNameInput').value.trim();
    if (!name) return alert('Group name is required');
    if (selectedGroupMembers.length === 0) return alert('Add at least one member');

    try {
        const res = await fetch('/api/chat/groups', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                name,
                members: selectedGroupMembers.map(m => m.employeeId)
            })
        });

        if (res.ok) {
            closeGroupModal();
            loadAllData();
        } else {
            alert('Failed to create group');
        }
    } catch (err) { console.error(err); }
}

// Socket Listener
socket.on('receive_message', msg => {
    console.log('📩 Message received from socket:', msg);
    const myId = user.employeeId || user.id;
    const isGroup = String(msg.receiverId).startsWith('group-') || String(msg.receiverId).length > 20;
    
    // Update last message data
    const contactId = isGroup ? msg.receiverId : (String(msg.senderId) === String(myId) ? msg.receiverId : msg.senderId);
    lastMessages[contactId] = {
        content: msg.content || (msg.fileUrl ? 'Shared a file' : ''),
        time: new Date(msg.createdAt).getTime()
    };

    if (isGroup) {
        if (activeChatId === msg.receiverId) {
            appendMessage(msg);
        } else {
            unreadCounts[msg.receiverId] = (unreadCounts[msg.receiverId] || 0) + 1;
            showNewMessageNotification(msg, true);
        }
    } else {
        const isFromMe = String(msg.senderId) === String(myId);
        const isToMeFromActive = String(msg.senderId) === String(activeChatId) && String(msg.receiverId) === String(myId);
        
        if (isFromMe || isToMeFromActive) {
            appendMessage(msg);
        } else {
            unreadCounts[msg.senderId] = (unreadCounts[msg.senderId] || 0) + 1;
            showNewMessageNotification(msg, false);
        }
    }
    
    renderUserList(); // Refresh list to sort and show unread badges
});

// ── WhatsApp Audio Chime (Web Audio API Synthesizer) ──
function playWhatsAppChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        
        // Bell tone 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1046, now + 0.08);
        gain1.gain.setValueAtTime(0.28, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        // Bell tone 2 (Crisp WhatsApp ping)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318, now + 0.09);
        osc2.frequency.exponentialRampToValueAtTime(1568, now + 0.22);
        gain2.gain.setValueAtTime(0.35, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.09);
        osc2.stop(now + 0.38);
    } catch (e) {
        console.warn('Audio chime blocked or not supported', e);
    }
}

// ── WhatsApp Floating Popup Banner ──
function showWhatsAppToast(title, body, contactId) {
    let container = document.getElementById('wa-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'wa-toast-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background:#ffffff; border-left:5px solid #25D366; border-radius:12px; padding:12px 18px; box-shadow:0 10px 30px rgba(0,0,0,0.18); display:flex; align-items:center; gap:14px; min-width:280px; max-width:380px; pointer-events:auto; cursor:pointer; animation:waSlideIn 0.3s ease-out;';
    
    toast.innerHTML = `
        <div style="width:40px; height:40px; border-radius:50%; background:#25D366; color:white; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
            <i class="fa-brands fa-whatsapp"></i>
        </div>
        <div style="flex:1; overflow:hidden;">
            <div style="font-weight:700; font-size:14px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
            <div style="font-size:12.5px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${body}</div>
        </div>
        <div style="font-size:11px; font-weight:800; color:#25D366; text-transform:uppercase;">Reply</div>
    `;

    toast.onclick = () => {
        if (contactId) {
            unreadCounts[contactId] = 0;
            selectUser(contactId, title);
            renderUserList();
        }
        toast.remove();
    };

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

function showNewMessageNotification(msg, isGroup) {
    const title = isGroup ? `Group: ${msg.Sender?.fullName || 'Someone'}` : `${msg.Sender?.fullName || 'Someone'}`;
    const body = msg.content || (msg.fileUrl ? 'Sent an attachment' : 'New message');
    const contactId = isGroup ? msg.receiverId : msg.senderId;

    // 1. Play authentic WhatsApp audio notification chime
    playWhatsAppChime();

    // 2. Show WhatsApp styled floating popup banner
    showWhatsAppToast(title, body, contactId);

    // 3. Native browser notification if allowed
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: '/exologo.png'
        });
        notification.onclick = () => {
            window.focus();
            if (contactId) {
                selectUser(contactId, title);
                renderUserList();
            }
        };
    }
}

socket.on('user_created', newUser => {
    console.log('✨ New employee joined:', newUser.fullName);
    loadAllData(); // Refresh the list
});
