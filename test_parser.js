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
          stateGeometries.set(parseInt(idMatch[1], 10), dMatch[1].length);
        }
      });
    }
  }
} catch (e) {}

console.log("Geometries map size:", stateGeometries.size);
