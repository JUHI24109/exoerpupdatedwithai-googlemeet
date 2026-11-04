const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const css = `
        /* Mobile Responsiveness */
        @media (max-width: 1024px) {
            .content { grid-template-columns: 1fr !important; gap: 20px; padding: 20px; }
            .dashboard-grid { grid-template-columns: 1fr !important; }
            .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
            header, .topbar { padding: 0 20px !important; }
        }
        @media (max-width: 768px) {
            body { flex-direction: column !important; }
            #sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 10px; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .logo { height: 40px !important; padding: 0 10px !important; border: none !important; font-size: 18px; width: 100%; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.05) !important; margin-bottom: 5px; }
            .nav-list, nav { flex-direction: row !important; padding: 0 !important; width: 100% !important; overflow-x: auto !important; gap: 5px !important; align-items: center; }
            .nav-item { padding: 8px 12px !important; font-size: 13px !important; white-space: nowrap !important; border-radius: 4px !important; }
            .metrics-grid { grid-template-columns: 1fr !important; }
            header, .topbar { height: auto !important; flex-direction: column !important; padding: 15px !important; align-items: stretch !important; gap: 15px !important; }
            .search { width: 100% !important; }
            .top-right { width: 100% !important; justify-content: space-between !important; }
            .dashboard { padding: 15px !important; }
            .modal { width: 95% !important; padding: 20px !important; border-radius: 12px !important; max-height: 80vh !important; }
            .chat-container { flex-direction: column !important; }
            .chat-sidebar { width: 100% !important; height: 250px !important; border-right: none !important; border-bottom: 1px solid var(--border) !important; flex-shrink: 0; }
            .ticket-header { flex-direction: column !important; gap: 10px !important; align-items: flex-start !important; }
            .action-bar { flex-direction: column !important; align-items: flex-start !important; gap: 15px !important; }
            .detail-pane { border-radius: 12px !important; }
            .btn { width: 100% !important; justify-content: center !important; }
        }
`;

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    
    // Remove if already exists to avoid duplicates
    content = content.replace(/\/\* Mobile Responsiveness \*\/[\s\S]*?(?=<\/style>)/g, '');
    
    // Insert before closing style tag
    if (content.includes('</style>')) {
        content = content.replace('</style>', css + '\n    </style>');
        fs.writeFileSync(fp, content, 'utf8');
    }
});

console.log('Mobile responsiveness added to all HTML pages.');
