const fs = require('fs');
const mapText = fs.readFileSync('sample maps/Morvaland 2026-08-24-18-39.map', 'utf8');
const lines = mapText.split("\r\n");
for(let i=0; i<lines.length; i++) {
  if (lines[i].startsWith("[") && lines[i].includes("fullName")) {
      try {
          const states = JSON.parse(lines[i]);
          const state = states.find(s => s.i > 0);
          console.log("State properties:", Object.keys(state));
          console.log("State pole:", state.pole);
          console.log("State center:", state.center);
      } catch (e) {}
  }
}
