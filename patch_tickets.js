const fs = require('fs');
const path = require('path');

// Update tickets.html
const htmlFile = path.join(__dirname, 'frontend/tickets.html');
let html = fs.readFileSync(htmlFile, 'utf8');

html = html.replace(
    `<textarea id="transferNote" rows="2" placeholder="Why are you transferring this?"></textarea>
            </div>
            <div style="display:flex; gap:10px; margin-top:30px;">`,
    `<textarea id="transferNote" rows="2" placeholder="Why are you transferring this?"></textarea>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label style="font-weight:700; font-size:12px;">Attach Files (Optional)</label>
                <input type="file" id="transferFile" multiple style="padding:10px; border:1px dashed var(--accent);">
            </div>
            <div style="display:flex; gap:10px; margin-top:30px;">`
);

html = html.replace(
    `<div style="font-size:10px; color:var(--text-muted); margin-top:5px;">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</div>
            </div>
            <div style="display:flex; gap:10px; margin-top:30px;">`,
    `<div style="font-size:10px; color:var(--text-muted); margin-top:5px;">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</div>
            </div>
            <div class="form-group" style="margin-top:15px;">
                <label style="font-weight:700; font-size:12px;">Attach Files (Optional)</label>
                <input type="file" id="shareFile" multiple style="padding:10px; border:1px dashed var(--accent);">
            </div>
            <div style="display:flex; gap:10px; margin-top:30px;">`
);
fs.writeFileSync(htmlFile, html);

// Update tickets_final.js
const jsFile = path.join(__dirname, 'frontend/js/tickets_final.js');
let js = fs.readFileSync(jsFile, 'utf8');

js = js.replace(
    `async function submitTransfer() {
    const assigneeId = document.getElementById('transferAssignee').value;
    const note = document.getElementById('transferNote').value;
    try {
        const res = await fetch(\`/api/tickets/\${selectedTicketId}/transfer\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify({ assigneeId, note })
        });`,
    `async function submitTransfer() {
    const assigneeId = document.getElementById('transferAssignee').value;
    const note = document.getElementById('transferNote').value;
    const files = document.getElementById('transferFile').files;
    
    try {
        const fd = new FormData();
        fd.append('assigneeId', assigneeId);
        fd.append('note', note);
        if (files) {
            for(let i=0; i<files.length; i++) {
                fd.append('files', files[i]);
            }
        }
        
        const res = await fetch(\`/api/tickets/\${selectedTicketId}/transfer\`, {
            method: 'PUT',
            headers: { Authorization: \`Bearer \${token}\` },
            body: fd
        });`
);

js = js.replace(
    `async function submitShare() {
    const sel = document.getElementById('shareUsers');
    const userIds = Array.from(sel.selectedOptions).map(opt => parseInt(opt.value));
    if (!userIds.length) return alert('Select at least one user');
    try {
        const res = await fetch(\`/api/tickets/\${selectedTicketId}/share\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify({ userIds })
        });`,
    `async function submitShare() {
    const sel = document.getElementById('shareUsers');
    const userIds = Array.from(sel.selectedOptions).map(opt => parseInt(opt.value));
    if (!userIds.length) return alert('Select at least one user');
    const files = document.getElementById('shareFile').files;
    
    try {
        const fd = new FormData();
        fd.append('userIds', JSON.stringify(userIds));
        if (files) {
            for(let i=0; i<files.length; i++) {
                fd.append('files', files[i]);
            }
        }
        
        const res = await fetch(\`/api/tickets/\${selectedTicketId}/share\`, {
            method: 'POST',
            headers: { Authorization: \`Bearer \${token}\` },
            body: fd
        });`
);

fs.writeFileSync(jsFile, js);

// Update ticketRoutes.js
const routesFile = path.join(__dirname, 'backend/routes/ticketRoutes.js');
let routes = fs.readFileSync(routesFile, 'utf8');

routes = routes.replace(
    `router.put('/:id/transfer', protect, async (req, res) => {
    try {
        const { assigneeId, note } = req.body;`,
    `router.put('/:id/transfer', protect, upload.array('files'), async (req, res) => {
    try {
        const { assigneeId, note } = req.body;`
);

routes = routes.replace(
    `        ticket.currentAssigneeId = assigneeId;
        ticket.status = 'Assigned';
        await ticket.save();`,
    `        ticket.currentAssigneeId = assigneeId;
        ticket.status = 'Assigned';
        await ticket.save();
        
        // Handle attachments
        if (req.files && req.files.length > 0) {
            for (let f of req.files) {
                await TicketAttachment.create({
                    ticketId: ticket.id,
                    userId: req.user.id,
                    fileName: f.originalname,
                    fileUrl: \`/uploads/\${f.filename}\`,
                    fileType: f.mimetype
                });
            }
        }`
);

routes = routes.replace(
    `router.post('/:id/share', protect, async (req, res) => {
    try {
        const { userIds } = req.body; // Array of user IDs`,
    `router.post('/:id/share', protect, upload.array('files'), async (req, res) => {
    try {
        const userIds = typeof req.body.userIds === 'string' ? JSON.parse(req.body.userIds) : req.body.userIds;`
);

routes = routes.replace(
    `        }
        res.json({ message: 'Ticket shared successfully' });`,
    `        }
        
        // Handle attachments
        if (req.files && req.files.length > 0) {
            for (let f of req.files) {
                await TicketAttachment.create({
                    ticketId: ticket.id,
                    userId: req.user.id,
                    fileName: f.originalname,
                    fileUrl: \`/uploads/\${f.filename}\`,
                    fileType: f.mimetype
                });
            }
        }
        
        res.json({ message: 'Ticket shared successfully' });`
);

fs.writeFileSync(routesFile, routes);
console.log('Ticket uploads patch applied.');
