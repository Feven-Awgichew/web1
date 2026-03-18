import fs from 'fs';

async function download() {
    try {
        const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Africa_map_blank.svg';
        const res = await fetch(url);
        const text = await res.text();
        fs.writeFileSync('africa-map-full.svg', text);
        console.log("Saved to africa-map-full.svg");
    } catch (e) {
        console.error("Error", e);
    }
}
download();
