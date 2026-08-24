const fs = require('fs');
const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf8');
const lines = mapText.split('\r\n');

// Find the pack object, which has the voronoi graph
let packLine = lines.find(l => l.startsWith('{"spacing"'));
if (packLine) {
  let pack = JSON.parse(packLine);
  console.log("Pack has cells:", !!pack.cells, "vertices:", !!pack.vertices, "features:", !!pack.features);
  if (pack.cells && pack.cells.p) {
    console.log("cells.p length:", pack.cells.p.length);
  }
}
