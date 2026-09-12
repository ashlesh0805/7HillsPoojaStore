const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const bin = fs.existsSync(chromePath) ? chromePath : edgePath;

const workspace = 'C:\\Users\\G ASHLESH\\OneDrive\\Desktop\\7HillsPoojaStore';

console.log('Using browser binary:', bin);

// 1. Render Icon 512x512
const iconOutput = path.join(workspace, 'playstore-icon-512.png');
console.log('Rendering 512x512 App Icon...');
try {
  execFileSync(bin, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${process.env.TEMP}\\browser_icon_render`,
    `--screenshot=${iconOutput}`,
    '--window-size=512,512',
    '--default-background-color=00000000',
    'http://localhost:3000/app-icon.svg'
  ], { timeout: 15000 });
} catch (e) {
  console.log('Icon render completed with code/signal:', e.status);
}

// 2. Render Feature Graphic 1024x500
const featureOutput = path.join(workspace, 'playstore-feature-graphic.png');
console.log('Rendering 1024x500 Feature Graphic...');
try {
  execFileSync(bin, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${process.env.TEMP}\\browser_feature_render`,
    `--screenshot=${featureOutput}`,
    '--window-size=1024,500',
    'http://localhost:3000/playstore-feature-graphic.svg'
  ], { timeout: 15000 });
} catch (e) {
  console.log('Feature graphic render completed with code/signal:', e.status);
}

// 3. Render 4 Mobile Phone Screenshots (390x844 px)
const screenshots = [
  { name: 'playstore-screenshot-1-home.png', url: 'http://localhost:3000/#/' },
  { name: 'playstore-screenshot-2-categories.png', url: 'http://localhost:3000/#/categories' },
  { name: 'playstore-screenshot-3-cart.png', url: 'http://localhost:3000/#/cart' },
  { name: 'playstore-screenshot-4-checkout.png', url: 'http://localhost:3000/#/checkout' }
];

for (const s of screenshots) {
  const out = path.join(workspace, s.name);
  console.log(`Rendering ${s.name}...`);
  try {
    execFileSync(bin, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=${process.env.TEMP}\\browser_shot_${Date.now()}`,
      `--screenshot=${out}`,
      '--window-size=412,892',
      s.url
    ], { timeout: 15000 });
  } catch (e) {}
}

// Check results
console.log('\n--- VERIFYING RESULTS ---');
if (fs.existsSync(iconOutput)) {
  const stat = fs.statSync(iconOutput);
  console.log('✓ playstore-icon-512.png generated:', stat.size, 'bytes');
}

if (fs.existsSync(featureOutput)) {
  const stat = fs.statSync(featureOutput);
  console.log('✓ playstore-feature-graphic.png generated:', stat.size, 'bytes');
}

for (const s of screenshots) {
  const out = path.join(workspace, s.name);
  if (fs.existsSync(out)) {
    const stat = fs.statSync(out);
    console.log(`✓ ${s.name} generated:`, stat.size, 'bytes');
  } else {
    console.log(`✗ ${s.name} missing`);
  }
}
