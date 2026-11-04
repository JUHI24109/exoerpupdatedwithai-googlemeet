import os, re

def replace_logo(root_path):
    for dirpath, _, filenames in os.walk(root_path):
        for fname in filenames:
            if fname.lower().endswith(('.html', '.js', '.css')):
                fpath = os.path.join(dirpath, fname)
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = re.sub(r'logo\.jpeg', 'exologo.png?v=2', content)
                if new_content != content:
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated {fpath}')

if __name__ == '__main__':
    replace_logo(r'c:/Users/juhie/Desktop/exo-ERP/frontend')
