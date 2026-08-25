const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  console.log("Navigating to test page...");
  await page.goto('http://localhost:3000/rooms/123/map-test', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log("Waiting 8 seconds for iframe to initialize and generate a random map...");
  await new Promise(r => setTimeout(r, 8000));
  
  console.log("Executing in-page script to inspect data...");
  const data = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const win = iframe.contentWindow;
    
    // pack is declared with let, so it's not on the window object directly.
    // We must use eval in the iframe context.
    const states = win.eval('pack.states');
    const provinces = win.eval('pack.provinces');
    const cells = win.eval('pack.cells');
    
    if (!states) return { error: "states is undefined" };
    
    const sampleState = states && states.length > 1 ? states[1] : null;
    const sampleProvince = provinces && provinces.length > 1 ? provinces[1] : null;
    
    const cellProvinces = cells && cells.province ? Array.from(cells.province).slice(0, 100) : [];
    const cellStates = cells && cells.state ? Array.from(cells.state).slice(0, 100) : [];
    
    return {
      numStates: states ? states.length : 0,
      sampleState: sampleState ? {
         i: sampleState.i,
         name: sampleState.name,
         color: sampleState.color,
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
  
  console.log("Testing state recolor...");
  const colorTest = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const win = iframe.contentWindow;
    const pack = win.eval('pack');
    if (!pack || !pack.states || pack.states.length < 2) return "Not enough states";
    
    const stateId = 1;
    const oldColor = pack.states[stateId].color;
    const newColor = "#ff0000";
    
    // Update internal state
    pack.states[stateId].color = newColor;
    
    let functionUsed = "";
    
    try {
      const statesBody = win.eval('statesBody');
      if (statesBody) {
        statesBody.select("#state" + stateId).attr("fill", newColor);
        functionUsed = "statesBody.select(...).attr('fill')";
      }
      return { oldColor, newColor, functionUsed, success: true };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log("Color test result:", colorTest);

  await browser.close();
})();
