const fs = require('fs');
const path = require('path');

const files = [
    'dashboard-chairman.html',
    'dashboard-ceo.html',
    'dashboard-employee.html',
    'dashboard-hr.html'
];

const newCSS = `
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f3f4f6;
            --surface: #ffffff;
            --border: #e5e7eb;
            --text-main: #111827;
            --text-light: #6b7280;
            --primary: #0f172a;
            --accent: #2563eb;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-main); height: 100vh; overflow: hidden; display: flex; font-size: 13px; }

        /* Sidebar - Dark Corporate */
        #sidebar { width: 240px; background: #111827; display: flex; flex-direction: column; flex-shrink: 0; color: #ffffff; }
        .logo { height: 70px; padding: 0 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo-icon { width: 32px; height: 32px; background: #2563eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
        .logo-text { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 0.5px; }
        
        nav { flex: 1; padding: 24px 16px; display: flex; flex-direction: column; gap: 6px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: #9ca3af; text-decoration: none; font-weight: 500; transition: all 0.2s; font-size: 14px; }
        .nav-item i { width: 18px; text-align: center; font-size: 15px; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #ffffff; }
        .nav-item.active { background: #1e293b; color: #ffffff; box-shadow: inset 3px 0 0 #2563eb; }

        /* Main Area */
        main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--bg); }
        
        /* Top Navbar */
        .topbar { height: 70px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; }
        .search { display: flex; align-items: center; background: #f8fafc; padding: 10px 16px; border-radius: 8px; width: 300px; border: 1px solid #e2e8f0; transition: all 0.2s; }
        .search:focus-within { border-color: #2563eb; background: #ffffff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .search input { border: none; background: transparent; outline: none; margin-left: 10px; font-size: 14px; width: 100%; color: var(--text-main); font-family: 'Inter', sans-serif; }
        
        .top-right { display: flex; align-items: center; gap: 24px; }
        .icon-btn { position: relative; color: var(--text-light); cursor: pointer; font-size: 18px; transition: color 0.2s; }
        .icon-btn:hover { color: var(--primary); }
        .badge { position: absolute; top: -6px; right: -6px; background: var(--danger); width: 16px; height: 16px; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }
        
        .profile { display: flex; align-items: center; gap: 12px; cursor: pointer; padding-left: 24px; border-left: 1px solid var(--border); }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }

        /* Dashboard Container */
        .dashboard { flex: 1; display: flex; flex-direction: column; padding: 32px; gap: 24px; min-height: 0; overflow-y: auto; }
        
        /* Greeting Header */
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
        .page-title { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 700; color: var(--primary); letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--text-light); margin-top: 4px; }
        
        /* KPI Cards */
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; flex-shrink: 0; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent); opacity: 0; transition: opacity 0.2s; }
        .kpi-card:hover::before { opacity: 1; }
        
        .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .kpi-title { font-size: 13px; font-weight: 600; color: var(--text-light); }
        .kpi-icon { width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .kpi-val { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 700; color: var(--text-main); line-height: 1; margin-bottom: 8px; }
        .trend { font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; }
        .trend.up { background: #dcfce7; color: #15803d; }
        .trend.down { background: #fee2e2; color: #b91c1c; }

        /* Main Grid */
        .bento-grid { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; min-height: 0; }
        
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; min-height: 400px; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid var(--border); font-weight: 700; font-size: 16px; display: flex; justify-content: space-between; align-items: center; background: var(--surface); color: var(--text-main); font-family: 'Outfit', sans-serif; }
        .card-body { padding: 24px; flex: 1; overflow-y: auto; position: relative; }

        /* Responsive Grid Allocations */
        .c-finance { grid-column: span 8; grid-row: span 1; }
        .c-ops { grid-column: span 4; grid-row: span 1; }
        .c-pipe { grid-column: span 4; grid-row: span 1; }
        .c-team { grid-column: span 8; grid-row: span 1; }
        .c-sched { grid-column: span 4; grid-row: span 1; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Lists and Tables */
        .list-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; border-radius: 6px; }
        .list-item:hover { background: #f8fafc; padding-left: 8px; padding-right: 8px; margin: 0 -8px; }
        .list-item:last-child { border-bottom: none; }
        .icon-box { width: 40px; height: 40px; border-radius: 8px; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #2563eb; font-weight: 700; }
        .item-text { flex: 1; min-width: 0; }
        .item-title { font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-sub { font-size: 12px; color: var(--text-light); }
        .item-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        th { text-align: left; padding: 14px 16px; font-weight: 600; color: var(--text-light); background: #f8fafc; border-bottom: 2px solid var(--border); text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        th:first-child { border-top-left-radius: 8px; }
        th:last-child { border-top-right-radius: 8px; }
        td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }
        
        .prog-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .prog-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    </style>
`;

files.forEach(file => {
    const fp = path.join('C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend', file);
    if (!fs.existsSync(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');

    // Remove old google fonts
    content = content.replace(/<link href="https:\/\/fonts.googleapis.com[^>]+>/, '');

    // Replace <style> block
    content = content.replace(/<style>[\s\S]*?<\/style>/, newCSS);

    // Ensure we don't have multiple styles if the regex missed something
    // Some pages might have inline styles that we want to keep, but we are replacing the main block.
    
    // Inject dynamic Page Header into the .dashboard area
    if (content.includes('<div class="dashboard">')) {
        content = content.replace(/<div class="dashboard">/, `<div class="dashboard">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Executive Dashboard</h1>
                    <div class="page-subtitle" id="dateStr">Loading date...</div>
                </div>
            </div>`);
    }

    fs.writeFileSync(fp, content, 'utf8');
});
console.log('UI Overhauled');
