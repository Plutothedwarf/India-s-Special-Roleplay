const fs = require('fs');

const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf8');
const stateGeometries = new Map();
try {
  const statesBodyMatch = mapText.match(/<g id="statesBody"[^>]*>([\s\S]*?)<\/g>/);
  if (statesBodyMatch) {
    const paths = statesBodyMatch[1].match(/<path[^>]+>/g);
    if (paths) {
      paths.forEach(p => {
        const idMatch = p.match(/id="state(\d+)"/);
        const dMatch = p.match(/d="([^"]+)"/);
        if (idMatch && dMatch) {
          stateGeometries.set(parseInt(idMatch[1], 10), dMatch[1]);
        }
      });
    }
  }
} catch (e) {}

let html = `
<!DOCTYPE html>
<html>
<body>
<svg viewBox="0 0 1366 641" width="1366" height="641" style="background: #1e293b;">
`;

for (let [id, d] of stateGeometries) {
    // Generate a random color
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    html += `<path d="${d}" fill="${color}" stroke="#fff" stroke-width="2" />\n`;
}

html += `
</svg>
</body>
</html>
`;

fs.writeFileSync('test_render.html', html);
console.log("Wrote test_render.html");
