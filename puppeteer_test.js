const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  console.log("Navigating to test page...");
  await page.goto('http://localhost:3000/rooms/123/map-test', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log("Waiting 5 seconds for iframe to initialize...");
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Clicking load map button...");
  await page.click('button');
  
  // Wait for the map to load and parse (it should log "States: ...")
  console.log("Waiting for map to load (5 seconds)...");
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Executing in-page script to inspect data...");
  const data = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const win = iframe.contentWindow;
    const pack = win.pack;
    
    if (!pack) return { error: "pack is undefined" };
    
    // Sample state data
    const states = pack.states;
    const sampleState = states && states.length > 1 ? states[1] : null;
    
    // Sample province data
    const provinces = pack.provinces;
    const sampleProvince = provinces && provinces.length > 1 ? provinces[1] : null;
    
    // Check cells
    const cells = pack.cells;
    const cellProvinces = cells && cells.province ? Array.from(cells.province).slice(0, 100) : [];
    const cellStates = cells && cells.state ? Array.from(cells.state).slice(0, 100) : [];
    
    return {
      numStates: states ? states.length : 0,
      sampleState: sampleState ? {
         i: sampleState.i,
         name: sampleState.name,
         color: sampleState.color,
         center: sampleState.center
      } : null,
      numProvinces: provinces ? provinces.length : 0,
      sampleProvince: sampleProvince ? {
         i: sampleProvince.i,
         state: sampleProvince.state,
         name: sampleProvince.name,
         color: sampleProvince.color
      } : null,
      hasCellProvinces: cellProvinces.some(p => p > 0),
      hasCellStates: cellStates.some(s => s > 0)
    };
  });
  
  console.log("Data extracted:", JSON.stringify(data, null, 2));
  
  // Test recoloring a state!
  // In Azgaar, states are SVG paths in <g id="statesBody">
  console.log("Testing state recolor...");
  const colorTest = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const win = iframe.contentWindow;
    const pack = win.pack;
    
    if (!pack || !pack.states || pack.states.length < 2) return "Not enough states";
    
    const stateId = 1;
    const oldColor = pack.states[stateId].color;
    const newColor = "#ff0000";
    
    // Update internal state
    pack.states[stateId].color = newColor;
    
    // Determine how to update the visual representation.
    // In Azgaar, states are drawn via statesBody.
    // Let's find out how it recolors. Usually it's either `drawStates()` or directly selecting the path.
    let functionUsed = "";
    
    try {
      // Azgaar uses D3. Let's see if win.statesBody exists
      if (win.statesBody) {
        win.statesBody.select("#state" + stateId).attr("fill", newColor);
        functionUsed = "d3 selection on statesBody";
      } else {
        // Find d3 element manually
        const doc = win.document;
        const path = doc.querySelector("#state" + stateId);
        if (path) {
          path.setAttribute("fill", newColor);
          functionUsed = "manual DOM setAttribute";
        }
      }
      
      return { oldColor, newColor, functionUsed };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log("Color test result:", colorTest);

  await browser.close();
})();
