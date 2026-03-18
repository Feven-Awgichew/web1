const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const indexContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');

// Extract highlights and schedule from index.html
const hStart = indexContent.indexOf('<section id="highlights"');
let hEnd = indexContent.indexOf('</section>', hStart);
hEnd = indexContent.indexOf('</section>', hEnd + 10) + 10;
const sectionsHTML = indexContent.substring(hStart, hEnd);

const files = ['about.html', 'media.html', 'news.html', 'stats.html', 'register.html'];

for (const f of files) {
    const filepath = path.join(projectDir, f);
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf8');

    // Check if sections already exist
    if (content.indexOf('<section id="highlights"') === -1) {
        // Inject before </main>
        const mEnd = content.indexOf('</main>');
        if (mEnd !== -1) {
            content = content.substring(0, mEnd) + '\n' + sectionsHTML + '\n' + content.substring(mEnd);
        } else {
            // For pages without main maybe, inject before contact or body end
            const cStart = content.indexOf('<section id="contact"');
            if (cStart !== -1) {
                content = content.substring(0, cStart) + '\n' + sectionsHTML + '\n' + content.substring(cStart);
            }
        }
    }

    // Update navigation links to be internal # links like index.html
    // Replace href="events.html" or href="events.html#..." with href="#..." or href="index.html#..."
    content = content.replace(/href="events\.html"(\s+style="cursor:\s*pointer;")>EVENTS/g, 'href="#schedule"$1>EVENTS');
    content = content.replace(/href="events\.html#highlights"/g, 'href="#highlights"');
    content = content.replace(/href="events\.html#schedule"/g, 'href="#schedule"');

    fs.writeFileSync(filepath, content, 'utf8');
}

// Ensure index.html also has the right links just in case
let iContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
iContent = iContent.replace(/href="events\.html"(\s+style="cursor:\s*pointer;")>EVENTS/g, 'href="#schedule"$1>EVENTS');
iContent = iContent.replace(/href="events\.html#highlights"/g, 'href="#highlights"');
iContent = iContent.replace(/href="events\.html#schedule"/g, 'href="#schedule"');
iContent = iContent.replace(/href="index\.html#schedule"/g, 'href="#schedule"');
iContent = iContent.replace(/href="index\.html#highlights"/g, 'href="#highlights"');
fs.writeFileSync(path.join(projectDir, 'index.html'), iContent, 'utf8');

// Delete events.html if it exists
if (fs.existsSync(path.join(projectDir, 'events.html'))) {
    fs.unlinkSync(path.join(projectDir, 'events.html'));
}

console.log('Restored sections to all subpages and fixed nav links.');
