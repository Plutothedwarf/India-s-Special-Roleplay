const fs = require('fs');
const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf8');

const stateGeometries = new Map();
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

const lines = mapText.split("\r\n");
const statesData = JSON.parse(lines[14]);
const validStates = statesData.filter((s) => s.i > 0 && s.name && s.name !== "Neutrals");

const nation = {
  azgaar_state_id: validStates[0].i,
  name: validStates[0].fullName || validStates[0].name,
  color: validStates[0].color || "#CCCCCC",
  geometry: stateGeometries.get(validStates[0].i) || null,
};

console.log("First nation geometry:", nation.geometry ? nation.geometry.substring(0, 100) + '...' : 'null');
console.log("First nation color:", nation.color);
