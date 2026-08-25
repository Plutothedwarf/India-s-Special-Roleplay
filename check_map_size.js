const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1200, height: 900 } });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/rooms/test-map-size', { waitUntil: 'networkidle0' });
  
  const mapDimensions = await page.evaluate(() => {
    const mapDiv = document.querySelector('iframe').parentElement;
    return {
      width: mapDiv.offsetWidth,
      height: mapDiv.offsetHeight,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth
    };
  });
  
  console.log("Map dimensions:", mapDimensions);
  
  await browser.close();
})();
