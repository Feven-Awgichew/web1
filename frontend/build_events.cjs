const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const indexContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
const newsContent = fs.readFileSync(path.join(projectDir, 'news.html'), 'utf8');

// Extract highlights and schedule from index.html
const hStart = indexContent.indexOf('<section id="highlights"');
let hEnd = indexContent.indexOf('</section>', hStart);
hEnd = indexContent.indexOf('</section>', hEnd + 10) + 10;
const sectionsHTML = indexContent.substring(hStart, hEnd);

// Create events.html from news.html
let eventsContent = newsContent.replace(
    /<title>.*?<\/title>/,
    '<title>Events &amp; Schedule | ASMIS 2026</title>'
);

const mStart = eventsContent.indexOf('<main');
const mEnd = eventsContent.indexOf('</main>', mStart) + 7;
const newMainHTML = `<main style="padding: 120px 0 0 0;">
${sectionsHTML}
</main>`;

eventsContent = eventsContent.substring(0, mStart) + newMainHTML + eventsContent.substring(mEnd);

// Also remove news specific script in the new events.html
let scriptStart = eventsContent.indexOf('<script>');
if (scriptStart !== -1) {
    let scriptEnd = eventsContent.indexOf('</script>', scriptStart) + 9;
    eventsContent = eventsContent.substring(0, scriptStart) + eventsContent.substring(scriptEnd);
}

fs.writeFileSync(path.join(projectDir, 'events.html'), eventsContent, 'utf8');

// Update all links in all HTML files
const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.html'));
for (const f of files) {
    let content = fs.readFileSync(path.join(projectDir, f), 'utf8');

    // Replace <a href="index.html#schedule" style="cursor: pointer;">EVENTS ▾</a>
    // with <a href="events.html" style="cursor: pointer;">EVENTS ▾</a>
    content = content.replace(
        /href="index\.html#schedule"(\s+style="cursor:\s*pointer;")>EVENTS/g,
        'href="events.html"$1>EVENTS'
    );

    content = content.replace(/>EVENTS ▾<\/a>/g, '>EVENTS ▾</a>');
    content = content.replace(/href="index\.html#highlights"/g, 'href="events.html#highlights"');
    content = content.replace(/href="index\.html#schedule"/g, 'href="events.html#schedule"');

    fs.writeFileSync(path.join(projectDir, f), content, 'utf8');
}

console.log('events.html built and all nav links updated.');
