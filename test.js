const fs = require('fs');
const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf8');
const match = mapText.match(/<g id="statesBody"[^>]*>([\s\S]*?)<\/g>/);
if (match) {
  const paths = match[1].match(/<path[^>]+>/g);
  if (paths) {
    paths.forEach(p => {
      const idMatch = p.match(/id="([^"]+)"/);
      console.log(idMatch ? idMatch[1] : 'no id');
    });
  }
}
