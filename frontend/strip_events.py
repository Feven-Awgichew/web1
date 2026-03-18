import os

files = [
    'about.html', 'media.html', 'news.html', 'stats.html', 'register.html'
]

for f in files:
    filepath = os.path.join(r'c:\Users\abate\Downloads\asmis-portal (4)\asmis-portal\frontend', f)
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    start_idx = content.find('<section id="highlights"')
    while start_idx != -1:
        # Find end of highlights section
        end_idx = content.find('</section>', start_idx) 
        # Find end of schedule section
        end_idx = content.find('</section>', end_idx + 10) 
        
        if end_idx != -1:
            # Remove from start to the end of the schedule section
            content = content[:start_idx] + content[end_idx + 10:]
        
        start_idx = content.find('<section id="highlights"')
    
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)
print("Removed sections from files.")
