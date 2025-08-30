const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '../src/index.html'));
  await page.waitForFunction('window.gameState && window.gameState.player');
  const initialX = await page.evaluate(() => gameState.player.x);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(100);
  await page.keyboard.up('KeyD');
  const movedX = await page.evaluate(() => gameState.player.x);
  if (movedX <= initialX) {
    console.error('Player did not move right');
    await browser.close();
    process.exit(1);
  }
  await page.waitForTimeout(500);
  const projectileCount = await page.evaluate(() => gameState.projectiles.length);
  if (projectileCount === 0) {
    console.error('No projectiles fired');
    await browser.close();
    process.exit(1);
  }
  await browser.close();
  console.log('All tests passed');
})();
