const fs = require('fs');
const path = require('path');

const files = ['about.html', 'media.html', 'news.html', 'stats.html', 'register.html'];

for (const f of files) {
    const filepath = path.join(__dirname, f);
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf8');

    let startIdx = content.indexOf('<section id="highlights"');
    while (startIdx !== -1) {
        let endIdx = content.indexOf('</section>', startIdx);
        endIdx = content.indexOf('</section>', endIdx + 10);

        if (endIdx !== -1) {
            content = content.substring(0, startIdx) + content.substring(endIdx + 10);
            startIdx = content.indexOf('<section id="highlights"');
        } else {
            break;
        }
    }
    fs.writeFileSync(filepath, content, 'utf8');
}
console.log("Stripped event sections from subpages.");
