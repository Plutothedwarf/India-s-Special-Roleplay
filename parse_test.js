const fs = require('fs');

function parseAzgaarMap(mapText) {
  const lines = mapText.replace(/\r\n/g, '\n').split('\n');
  let svgStart = -1, svgEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('<svg')) svgStart = i;
    if (lines[i].includes('</svg>')) svgEnd = i;
  }

  let blocks = [];
  if (svgStart !== -1 && svgEnd !== -1) {
    blocks.push(...lines.slice(0, svgStart));
    blocks.push(lines.slice(svgStart, svgEnd + 1).join('\n'));
    blocks.push(...lines.slice(svgEnd + 1));
  } else {
    blocks = mapText.split(mapText.includes('\r\n') ? '\r\n' : '\n');
  }

  let statesData = [];
  try {
    statesData = JSON.parse(blocks[14]);
  } catch (e) {}

  const nations = [];
  const validStates = statesData.filter((s) => s.i > 0 && s.name && s.name !== "Neutrals");
  for (const state of validStates) {
    nations.push(state.fullName || state.name);
  }
  
  return nations;
}

const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf-8');
const parsedNations = parseAzgaarMap(mapText);
console.log("Total Nations:", parsedNations.length);
parsedNations.forEach((n, i) => console.log(`${i+1}. ${n}`));
