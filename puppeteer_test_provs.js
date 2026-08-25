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
  
  console.log("Testing province rendering...");
  const renderTest = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const win = iframe.contentWindow;
    const doc = win.document;
    
    // Check if the provs layer exists
    const provsLayer = doc.getElementById('provs');
    if (!provsLayer) return { error: "No provs layer found" };
    
    // Check if it has paths
    const initialPaths = provsLayer.querySelectorAll('path').length;
    const initialPolygons = provsLayer.querySelectorAll('polygon').length;
    
    // Try to trigger drawProvinces if it's 0, or just toggle it
    let triggeredFunction = false;
    if (initialPaths === 0 && initialPolygons === 0 && typeof win.drawProvinces === 'function') {
       win.drawProvinces();
       triggeredFunction = true;
    }
    
    const finalPaths = provsLayer.querySelectorAll('path').length;
    const finalPolygons = provsLayer.querySelectorAll('polygon').length;
    
    return {
      initialPaths,
      initialPolygons,
      triggeredFunction,
      finalPaths,
      finalPolygons,
      displayStyle: provsLayer.style.display,
      layerVisibility: provsLayer.getAttribute('display')
    };
  });
  
  console.log("Render test result:", renderTest);

  await browser.close();
})();
