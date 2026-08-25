export interface MapNation {
  azgaar_state_id: number;
  name: string;
  color: string;
  capital_burg_name: string | null;
}

export interface MapProvince {
  azgaar_province_id: number;
  azgaar_state_id: number;
  name: string;
}

export interface ParsedMap {
  nations: MapNation[];
  provinces: MapProvince[];
}

export function parseAzgaarMap(mapText: string): ParsedMap {
  // Repair corrupted maps (where \n was replaced by \r\n inside the SVG)
  const lines = mapText.replace(/\r\n/g, '\n').split('\n');
  let svgStart = -1, svgEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('<svg')) svgStart = i;
    if (lines[i].includes('</svg>')) svgEnd = i;
  }

  let blocks: string[] = [];
  if (svgStart !== -1 && svgEnd !== -1) {
    blocks.push(...lines.slice(0, svgStart));
    blocks.push(lines.slice(svgStart, svgEnd + 1).join('\n'));
    blocks.push(...lines.slice(svgEnd + 1));
  } else {
    // If not corrupted or missing SVG, split by \r\n or fallback to \n
    blocks = mapText.split(mapText.includes('\r\n') ? '\r\n' : '\n');
  }

  if (blocks.length < 35) {
    throw new Error("Invalid Azgaar map file: too few lines to parse");
  }

  // State data is at index 14
  // Province data is at index 30
  // Burg data is at index 15 (if we wanted to parse capitals)
  let statesData: any[] = [];
  let provincesData: any[] = [];
  let burgsData: any[] = [];

  try {
    statesData = JSON.parse(blocks[14]);
  } catch (e) {
    console.warn("Failed to parse states data", e);
  }

  try {
    provincesData = JSON.parse(blocks[30]);
  } catch (e) {
    console.warn("Failed to parse provinces data", e);
  }

  try {
    burgsData = JSON.parse(blocks[15]);
  } catch (e) {
    console.warn("Failed to parse burgs data", e);
  }

  const nations: MapNation[] = [];
  const provinces: MapProvince[] = [];

  // Filter out the "Neutrals" state (usually state id 0)
  const validStates = statesData.filter((s) => s.i > 0 && s.name && s.name !== "Neutrals");

  for (const state of validStates) {
    let capitalName: string | null = null;
    
    // Attempt to lookup capital burg name
    if (state.capital && burgsData.length > 0) {
      // Burgs array starts with a 0 at index 0, then objects
      const burg = burgsData.find((b: any) => typeof b === 'object' && b.i === state.capital);
      if (burg && burg.name) {
        capitalName = burg.name;
      }
    }

    nations.push({
      azgaar_state_id: state.i,
      name: state.fullName || state.name,
      color: state.color || "#CCCCCC",
      capital_burg_name: capitalName
    });
  }

  // Filter out the initial 0 from provinces array and any invalid ones
  const validProvinces = provincesData.filter((p) => typeof p === 'object' && p.i && p.name);

  for (const prov of validProvinces) {
    // Only keep provinces that belong to a valid parsed nation
    if (nations.some(n => n.azgaar_state_id === prov.state)) {
      provinces.push({
        azgaar_province_id: prov.i,
        azgaar_state_id: prov.state,
        name: prov.fullName || prov.name
      });
    }
  }

  return { nations, provinces };
}
