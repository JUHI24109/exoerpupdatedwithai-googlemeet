import re
dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix initDashboard to check for errors and redirect to login if unauthorized
init_dash_pattern = re.compile(r'(const d = await res\.json\(\);)', re.DOTALL)
def inject_auth_check(match):
    return match.group(1) + """
                if (d.error === 'Not authorized' || d.error === 'Token failed') {
                    localStorage.clear();
                    window.location.href = '/';
                    return;
                }
"""
content = init_dash_pattern.sub(inject_auth_check, content, count=1)

# Fix myRaisedChart to safely access pData and use Assigned instead of Pending
bar_chart_pattern = re.compile(r'datasets: \[\s*\{ label: \'Total Raised\', data: \[pData\.raised\.total, 0, 0, 0, 0, 0\], backgroundColor: \'#1e3a8a\' \},\s*\{ label: \'Working\', data: \[0, pData\.raised\.Working, 0, 0, 0, 0\], backgroundColor: \'#10b981\' \},\s*\{ label: \'Pending\', data: \[0, 0, pData\.raised\.Pending, 0, 0, 0\], backgroundColor: \'#f59e0b\' \},\s*\{ label: \'Completed\', data: \[0, 0, 0, pData\.raised\.Completed, 0, 0\], backgroundColor: \'#2563eb\' \},\s*\{ label: \'Rejected\', data: \[0, 0, 0, 0, pData\.raised\.Rejected, 0\], backgroundColor: \'#dc2626\' \},\s*\{ label: \'Overdue\', data: \[0, 0, 0, 0, 0, pData\.raised\.Overdue\], backgroundColor: \'#d97706\' \}\s*\]', re.DOTALL)

new_bar_datasets = """datasets: [
                            { label: 'Total Raised', data: [pData.raised?.total || 0, 0, 0, 0, 0, 0], backgroundColor: '#1e3a8a' },
                            { label: 'Working', data: [0, pData.raised?.Working || 0, 0, 0, 0, 0], backgroundColor: '#10b981' },
                            { label: 'Assigned', data: [0, 0, pData.raised?.Assigned || 0, 0, 0, 0], backgroundColor: '#f59e0b' },
                            { label: 'Completed', data: [0, 0, 0, pData.raised?.Completed || 0, 0, 0], backgroundColor: '#2563eb' },
                            { label: 'Rejected', data: [0, 0, 0, 0, pData.raised?.Rejected || 0, 0], backgroundColor: '#dc2626' },
                            { label: 'Overdue', data: [0, 0, 0, 0, 0, pData.raised?.Overdue || 0], backgroundColor: '#d97706' }
                        ]"""
content = bar_chart_pattern.sub(new_bar_datasets, content)

# Change the labels array in bar chart to match Assigned
content = content.replace("labels: ['Total Raised', 'Working', 'Pending', 'Completed', 'Rejected', 'Overdue']", "labels: ['Total Raised', 'Working', 'Assigned', 'Completed', 'Rejected', 'Overdue']")

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard UI fixed with safe accessors and auth checks')
