import subprocess
import re

# Get original dashboard.html from git
orig_bytes = subprocess.check_output(['git', 'show', 'HEAD:frontend/dashboard.html'])
orig_content = orig_bytes.decode('utf-8')

# Extract from `async function loadLists()` to the last `</script>`
match = re.search(r'(async function loadLists\(\).*?)</script>', orig_content, re.DOTALL)
if match:
    missing_code = match.group(1)
    
    # Read current dashboard.html
    dash_path = r'c:\Users\juhie\Desktop\exo-ERP\frontend\dashboard.html'
    with open(dash_path, 'r', encoding='utf-8') as f:
        curr = f.read()
    
    # We want to insert `missing_code` right after the end of `initCharts` block, or before the closing `</script>`
    # In our current dashboard.html, the bottom is:
    # }
    # </script>
    # <script src="/js/nav-sync.js"></script>
    # <script src="/js/logo-fix.js"></script>
    # </body>
    
    curr = curr.replace('}\n</script>\n<script src="/js/nav-sync.js">', '}\n\n' + missing_code + '\n</script>\n<script src="/js/nav-sync.js">')
    
    with open(dash_path, 'w', encoding='utf-8') as f:
        f.write(curr)
    print('Restored missing functions!')
else:
    print('Could not find loadLists in original!')
