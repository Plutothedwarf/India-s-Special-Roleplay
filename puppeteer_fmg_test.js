const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Forward all console logs from the page
  page.on('console', msg => {
    if (msg.text().includes('stats') || msg.text().includes('TOTAL')) return;
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });

  console.log("Navigating to FMG directly...");
  await page.goto('http://localhost:3000/azgaar/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log("Waiting for FMG to initialize its random map...");
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Fetching the map text from API via page context...");
  const error = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/maps/Morvaland%202026-08-24-18-39');
      if (!res.ok) return "Fetch failed: " + res.status;
      const mapText = await res.text();
      
      console.log("Map text fetched, length: " + mapText.length);
      console.log("First 50 chars: " + mapText.substring(0, 50));
      
      const fixedText = mapText.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      console.log("Fixed text length: " + fixedText.length);
      console.log("First 50 chars fixed: " + fixedText.substring(0, 50));
      
      const blob = new Blob([fixedText], { type: "text/plain" });
      
      return new Promise((resolve) => {
        // override alertMessage to see what FMG complains about
        const originalHtml = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        
        const mo = new MutationObserver(() => {
          const alertMsg = document.getElementById('alertMessage');
          if (alertMsg && alertMsg.innerHTML.includes('The file does not look like a valid save file')) {
            resolve("FMG reported invalid save file");
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
        
        window.uploadMap(blob, () => {
          console.log("uploadMap callback triggered!");
          setTimeout(() => resolve(null), 2000);
        });
      });
      
    } catch (e) {
      return "Exception: " + e.message;
    }
  });
  
  console.log("Upload error result:", error);
  
  await browser.close();
})();
