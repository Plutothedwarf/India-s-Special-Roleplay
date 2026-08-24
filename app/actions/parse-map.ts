export interface MapNation {
  azgaar_state_id: number;
  name: string;
  color: string;
  capital_burg_name: string | null;
  geometry: string | null;
  label_x: number | null;
  label_y: number | null;
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
  // Azgaar maps are separated by \r\n
  const lines = mapText.split("\r\n");

  if (lines.length < 35) {
    throw new Error("Invalid Azgaar map file: too few lines to parse");
  }

  // State data is at index 14
  // Province data is at index 30
  // Burg data is at index 15 (if we wanted to parse capitals)
  let statesData: any[] = [];
  let provincesData: any[] = [];
  let burgsData: any[] = [];

  try {
    statesData = JSON.parse(lines[14]);
  } catch (e) {
    console.warn("Failed to parse states data", e);
  }

  try {
    provincesData = JSON.parse(lines[30]);
  } catch (e) {
    console.warn("Failed to parse provinces data", e);
  }

  try {
    burgsData = JSON.parse(lines[15]);
  } catch (e) {
    console.warn("Failed to parse burgs data", e);
  }

  const stateGeometries = new Map<number, string>();
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
  } catch (e) {
    console.warn("Failed to parse state geometries", e);
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
      capital_burg_name: capitalName,
      geometry: stateGeometries.get(state.i) || null,
      label_x: state.pole ? state.pole[0] : null,
      label_y: state.pole ? state.pole[1] : null,
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
