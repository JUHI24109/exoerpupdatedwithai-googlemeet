const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/dashboard-hr.html');
let content = fs.readFileSync(file, 'utf8');

// 1. Theme Change (Pink to Navy Blue)
content = content.replace(
`        :root{
            --bg:#ffffff;
            --surface:#ffffff;
            --border:#f9a8d4;
            --border-soft:#fbcfe8;
            --text-main:#1f2937;
            --text-light:#6b7280;
            --primary:#ec4899;
            --primary-dark:#db2777;
            --accent:#f472b6;
            --success:#16a34a;
            --danger:#dc2626;
            --warning:#f59e0b;
            --pink-bg:#fdf2f8;
            --pink-light:#fce7f3;
        }`,
`        :root{
            --bg:#f8fafc;
            --surface:#ffffff;
            --border:#cbd5e1;
            --border-soft:#e2e8f0;
            --text-main:#1e293b;
            --text-light:#64748b;
            --primary:#000080;
            --primary-dark:#000066;
            --accent:#3b82f6;
            --success:#16a34a;
            --danger:#dc2626;
            --warning:#f59e0b;
            --pink-bg:#eff6ff;
            --pink-light:#dbeafe;
        }`
);

// Fix specific text colors using pink hex
content = content.replace(/#be185d/g, 'var(--primary)');
content = content.replace(/#9d174d/g, 'var(--primary-dark)');
content = content.replace(/#ec4899/g, 'var(--primary)');
content = content.replace(/rgba\(236,72,153,/g, 'rgba(0,0,128,');
content = content.replace(/rgba\(249,168,212,/g, 'rgba(59,130,246,');
content = content.replace(/#fce7f3/g, 'var(--pink-light)');
content = content.replace(/#fbcfe8/g, 'var(--border-soft)');
content = content.replace(/#f9a8d4/g, 'var(--border)');
content = content.replace(/#f472b6/g, 'var(--accent)');
content = content.replace(/#db2777/g, 'var(--primary-dark)');

// 2. Add New Navigation Links
content = content.replace(
    `<a href="employees.html" class="nav-link"><i class="fa-solid fa-users"></i> Staff Directory</a>`,
    `<a href="#" class="nav-link" id="nav-assets" onclick="showSection('assets')"><i class="fa-solid fa-laptop"></i> Undertaking</a>
        <a href="#" class="nav-link" id="nav-empdata" onclick="showSection('empdata')"><i class="fa-solid fa-folder-open"></i> Employee Data</a>
        <a href="employees.html" class="nav-link"><i class="fa-solid fa-users"></i> Staff Directory</a>`
);

// 3. Update Leave table headers & rendering
content = content.replace(
    `<th>Employee</th><th>Duration</th><th>Reason</th><th>Status</th><th>Actions</th>`,
    `<th>Employee</th><th>Duration</th><th>Reason</th><th>Status</th><th>Actions</th>`
);
content = content.replace(
    `<td><div class="\${badgeClass(l.hrStatus)}">HR: \${l.hrStatus}</div><div style="margin-top:6px" class="\${badgeClass(l.ceoStatus)}">CEO: \${l.ceoStatus}</div></td>`,
    `<td><div class="\${badgeClass(l.hrStatus)}">\${l.status}</div></td>`
);

content = content.replace(
    `rows.push([l.Employee?.fullName||'',l.Employee?.employeeId||'',l.Employee?.role||'',l.startDate,l.endDate,l.type||'',l.reason||'',l.status||'',l.hrStatus||'',l.ceoStatus||'']);`,
    `rows.push([l.Employee?.fullName||'',l.Employee?.employeeId||'',l.Employee?.role||'',l.startDate,l.endDate,l.type||'',l.reason||'',l.status||'']);`
);
content = content.replace(
    `['Employee Name','Employee ID','Role','Start Date','End Date','Type','Reason','Status','HR Status','CEO Status']`,
    `['Employee Name','Employee ID','Role','Start Date','End Date','Type','Reason','Status']`
);


// 4. Add the new Sections HTML
const newSectionsHTML = `
    <!-- ═══ ASSETS UNDERTAKING SECTION ═══ -->
    <section id="assetsSection" style="display:none;flex-direction:column;flex:1;padding:20px;gap:14px;overflow-y:auto;">
        <div class="panel">
            <h2><i class="fa-solid fa-laptop" style="color:var(--primary)"></i> Assets Undertaking</h2>
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
                <div style="background:var(--pink-bg); padding:15px; border-radius:10px; border:1px solid var(--border-soft);">
                    <h3 style="font-size:14px; margin-bottom:10px; color:var(--primary);">Assign Asset</h3>
                    <select id="assetCategory" class="input" style="width:100%; margin-bottom:10px;" onchange="renderAssetForm()">
                        <option value="Mobile">Mobile</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Fuel Card">Fuel Card</option>
                        <option value="Vendor Device">Vendor Device</option>
                    </select>
                    
                    <div id="assetFormContainer"></div>
                    
                    <button class="btn btn-primary" style="width:100%; margin-top:10px;" onclick="saveAsset()">Assign Asset</button>
                </div>
                
                <div>
                    <div class="toolbar" style="justify-content:flex-end;">
                        <input type="month" id="assetMonth" class="input" />
                        <button class="btn btn-primary" onclick="downloadAssets()"><i class="fa-solid fa-download"></i> Download Excel</button>
                    </div>
                    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border-soft)">
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Employee</th><th>Category</th><th>Details</th><th>Actions</th></tr>
                            </thead>
                            <tbody id="assetsTableBody"><tr><td colspan="5">Loading assets...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══ EMPLOYEE DATA SECTION ═══ -->
    <section id="empdataSection" style="display:none;flex-direction:column;flex:1;padding:20px;gap:14px;overflow-y:auto;">
        <div class="panel">
            <h2><i class="fa-solid fa-folder-open" style="color:var(--primary)"></i> Employee Documents</h2>
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
                <div style="background:var(--pink-bg); padding:15px; border-radius:10px; border:1px solid var(--border-soft);">
                    <h3 style="font-size:14px; margin-bottom:10px; color:var(--primary);">Upload Documents</h3>
                    <input type="text" id="docEmpId" class="input" placeholder="Employee ID" style="width:100%; margin-bottom:10px;">
                    <input type="text" id="docEmpName" class="input" placeholder="Employee Name" style="width:100%; margin-bottom:10px;">
                    <input type="text" id="docDept" class="input" placeholder="Department" style="width:100%; margin-bottom:10px;">
                    <input type="text" id="docDesig" class="input" placeholder="Designation" style="width:100%; margin-bottom:10px;">
                    <input type="text" id="docTitle" class="input" placeholder="Document Title" style="width:100%; margin-bottom:10px;">
                    <select id="docType" class="input" style="width:100%; margin-bottom:10px;">
                        <option value="ID Proof">ID Proof</option>
                        <option value="Address Proof">Address Proof</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Other">Other</option>
                    </select>
                    <input type="file" id="docFiles" class="input" multiple style="width:100%; margin-bottom:10px; background:#fff;">
                    <button class="btn btn-primary" style="width:100%;" onclick="uploadDoc()">Upload Files</button>
                </div>
                
                <div>
                    <div class="toolbar" style="justify-content:flex-start;">
                        <input type="text" id="docSearchEmp" class="input" placeholder="Filter by Emp ID">
                        <button class="btn btn-soft" onclick="loadDocs()"><i class="fa-solid fa-filter"></i> Filter</button>
                    </div>
                    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border-soft)">
                        <table>
                            <thead>
                                <tr><th>Employee</th><th>Doc Title</th><th>Type</th><th>File</th><th>Actions</th></tr>
                            </thead>
                            <tbody id="docsTableBody"><tr><td colspan="5">Loading documents...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;

content = content.replace('</main>', newSectionsHTML + '\n</main>');

// 5. Add JS for switching sections and handling logic
content = content.replace(
    `document.getElementById('attendanceSection').style.display = name==='attendance'?'flex':'none';`,
    `document.getElementById('attendanceSection').style.display = name==='attendance'?'flex':'none';
    document.getElementById('assetsSection').style.display = name==='assets'?'flex':'none';
    document.getElementById('empdataSection').style.display = name==='empdata'?'flex':'none';`
);

content = content.replace(
    `if(name==='attendance'){document.getElementById('nav-attendance').classList.add('active'); document.getElementById('headerTitle').innerText='Attendance Analytics & Export';}`,
    `if(name==='attendance'){document.getElementById('nav-attendance').classList.add('active'); document.getElementById('headerTitle').innerText='Attendance Analytics & Export';}
    if(name==='assets'){document.getElementById('nav-assets').classList.add('active'); document.getElementById('headerTitle').innerText='Assets Undertaking'; loadAssets();}
    if(name==='empdata'){document.getElementById('nav-empdata').classList.add('active'); document.getElementById('headerTitle').innerText='Employee Documents Management'; loadDocs();}`
);

const newScripts = `
// ── ASSETS LOGIC ──
function renderAssetForm() {
    const cat = document.getElementById('assetCategory').value;
    const cont = document.getElementById('assetFormContainer');
    let html = \`<input type="text" id="asEmpId" class="input" placeholder="Employee ID (Required)" style="width:100%; margin-bottom:10px;">
                <input type="text" id="asEmpName" class="input" placeholder="Employee Name (Required)" style="width:100%; margin-bottom:10px;">
                <input type="text" id="asCompany" class="input" placeholder="Company (Required)" style="width:100%; margin-bottom:10px;">
                <input type="date" id="asRecDate" class="input" title="Receiving Date" style="width:100%; margin-bottom:10px;">
                <input type="date" id="asRetDate" class="input" title="Return Date" style="width:100%; margin-bottom:10px;">\`;

    if (cat === 'Mobile') {
        html += \`<input type="text" id="asMake" class="input" placeholder="Make" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asMobile" class="input" placeholder="Mobile Number" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asPin" class="input" placeholder="PIN" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asPuk" class="input" placeholder="PUK" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asImei1" class="input" placeholder="IMEI 1" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asImei2" class="input" placeholder="IMEI 2" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asSerial" class="input" placeholder="Serial Number" style="width:100%; margin-bottom:10px;">\`;
    } else if (cat === 'Laptop') {
        html += \`<input type="text" id="asMake" class="input" placeholder="Make/Model" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asProdId" class="input" placeholder="Product ID / Model Number" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asSerial" class="input" placeholder="Serial Number" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asSerialId" class="input" placeholder="Serial Number ID" style="width:100%; margin-bottom:10px;">\`;
    } else if (cat === 'Fuel Card') {
        html += \`<input type="text" id="asCardNo" class="input" placeholder="Card No" style="width:100%; margin-bottom:10px;">
                 <input type="date" id="asExp" class="input" title="Expiry Date" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asReg" class="input" placeholder="Car Registration Number" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asCardPin" class="input" placeholder="Card Pin" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asLoc" class="input" placeholder="Location" style="width:100%; margin-bottom:10px;">\`;
    } else if (cat === 'Vendor Device') {
        html += \`<input type="text" id="asSerial" class="input" placeholder="Serial Number" style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asBarcode" class="input" placeholder="Barcode No." style="width:100%; margin-bottom:10px;">
                 <input type="text" id="asLoc" class="input" placeholder="Location" style="width:100%; margin-bottom:10px;">\`;
    }
    cont.innerHTML = html;
}

async function saveAsset() {
    const data = {
        category: document.getElementById('assetCategory').value,
        employeeId: document.getElementById('asEmpId')?.value,
        employeeName: document.getElementById('asEmpName')?.value,
        company: document.getElementById('asCompany')?.value,
        receivingDate: document.getElementById('asRecDate')?.value,
        returnDate: document.getElementById('asRetDate')?.value,
        makeModel: document.getElementById('asMake')?.value,
        mobileNumber: document.getElementById('asMobile')?.value,
        pin: document.getElementById('asPin')?.value,
        puk: document.getElementById('asPuk')?.value,
        imei1: document.getElementById('asImei1')?.value,
        imei2: document.getElementById('asImei2')?.value,
        serialNumber: document.getElementById('asSerial')?.value,
        productIdModelNumber: document.getElementById('asProdId')?.value,
        serialNumberId: document.getElementById('asSerialId')?.value,
        cardNumber: document.getElementById('asCardNo')?.value,
        expiryDate: document.getElementById('asExp')?.value,
        carRegistrationNumber: document.getElementById('asReg')?.value,
        cardPin: document.getElementById('asCardPin')?.value,
        barcodeNo: document.getElementById('asBarcode')?.value,
        location: document.getElementById('asLoc')?.value
    };

    if(!data.employeeId || !data.employeeName || !data.company || !data.receivingDate) return alert('Fill required fields');

    try {
        const res = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
            body: JSON.stringify(data)
        });
        if(res.ok) { alert('Asset Assigned'); loadAssets(); }
        else alert('Failed to assign');
    } catch(e) { console.error(e); }
}

async function loadAssets() {
    try {
        const res = await fetch('/api/assets', { headers: { Authorization: \`Bearer \${token}\` } });
        const rows = await res.json();
        const body = document.getElementById('assetsTableBody'); body.innerHTML = '';
        rows.forEach(r => {
            body.innerHTML += \`<tr>
                <td>\${r.receivingDate}</td>
                <td><div style="font-weight:700;">\${r.employeeName}</div><div style="font-size:10px;">\${r.employeeId}</div></td>
                <td><span class="badge badge-ok">\${r.category}</span></td>
                <td>\${r.makeModel || r.serialNumber || r.cardNumber || ''}</td>
                <td><button class="btn btn-danger" style="padding:4px 8px;" onclick="delAsset(\${r.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>\`;
        });
    } catch(e) {}
}

async function delAsset(id) {
    if(!confirm('Delete this record?')) return;
    await fetch(\`/api/assets/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
    loadAssets();
}

function downloadAssets() {
    const month = document.getElementById('assetMonth').value || new Date().toISOString().slice(0,7);
    window.location.href = \`/api/assets/report/monthly?month=\${month}&token=\${token}\`;
}

// ── EMPLOYEE DOCS LOGIC ──
async function uploadDoc() {
    const fd = new FormData();
    fd.append('employeeId', document.getElementById('docEmpId').value);
    fd.append('employeeName', document.getElementById('docEmpName').value);
    fd.append('department', document.getElementById('docDept').value);
    fd.append('designation', document.getElementById('docDesig').value);
    fd.append('docTitle', document.getElementById('docTitle').value);
    fd.append('docType', document.getElementById('docType').value);
    
    const files = document.getElementById('docFiles').files;
    if(!files.length) return alert('Select files');
    
    for(let i=0; i<files.length; i++) fd.append('files', files[i]);

    try {
        const res = await fetch('/api/employee-documents/upload', {
            method: 'POST',
            headers: { Authorization: \`Bearer \${token}\` },
            body: fd
        });
        if(res.ok) { alert('Uploaded'); loadDocs(); }
        else alert('Failed upload');
    } catch(e) { console.error(e); }
}

async function loadDocs() {
    const empId = document.getElementById('docSearchEmp').value;
    let url = '/api/employee-documents';
    if(empId) url += \`?employeeId=\${empId}\`;
    
    try {
        const res = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });
        const rows = await res.json();
        const body = document.getElementById('docsTableBody'); body.innerHTML = '';
        rows.forEach(r => {
            body.innerHTML += \`<tr>
                <td><div style="font-weight:700;">\${r.employeeName}</div><div style="font-size:10px;">\${r.employeeId}</div></td>
                <td>\${r.docTitle}</td>
                <td><span class="badge badge-hold">\${r.docType}</span></td>
                <td><a href="\${r.fileUrl}" target="_blank" class="btn btn-soft" style="padding:4px 8px;"><i class="fa-solid fa-eye"></i> View</a></td>
                <td><button class="btn btn-danger" style="padding:4px 8px;" onclick="delDoc(\${r.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>\`;
        });
    } catch(e) {}
}

async function delDoc(id) {
    if(!confirm('Delete this document?')) return;
    await fetch(\`/api/employee-documents/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
    loadDocs();
}
`;

content = content.replace('initDashboard();', newScripts + '\ninitDashboard();\nsetTimeout(renderAssetForm, 500);');

fs.writeFileSync(file, content);
console.log('Dashboard HR patched.');
