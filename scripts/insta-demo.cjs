// Graba screenshots de Mi Turno para Instagram
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'insta-shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  // Simular Android
  await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36' });
  
  // 1. Landing hero
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '01-landing-hero.png'), fullPage: false });
  console.log('✓ 01-landing-hero.png');
  
  // 2. Calculadora (scrollear hasta ella)
  await page.evaluate(() => {
    document.getElementById('landingCalc')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '02-calculadora.png'), fullPage: false });
  console.log('✓ 02-calculadora.png');
  
  // 3. FAQ
  await page.evaluate(() => {
    document.querySelector('.faq-section')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);
  // Abrir un FAQ
  await page.click('.faq-item summary');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '03-faq-abierto.png'), fullPage: false });
  console.log('✓ 03-faq-abierto.png');
  
  // 4. Android download section
  await page.evaluate(() => {
    document.getElementById('androidSection')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    document.getElementById('androidSection').style.display = 'block';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '04-descarga-android.png'), fullPage: false });
  console.log('✓ 04-descarga-android.png');
  
  await browser.close();
  console.log('\n📸 Listo! Las capturas están en insta-shots/');
})().catch(e => { console.error(e); process.exit(1); });
