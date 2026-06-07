import { chromium } from 'playwright';

async function debugEditor() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });

    console.log('=== PAGE STRUCTURE DEBUG ===\n');

    // Get all input elements
    const inputs = await page.locator('input').all();
    console.log(`Total inputs found: ${inputs.length}`);
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const value = await inputs[i].inputValue();
      const type = await inputs[i].getAttribute('type');
      console.log(`  [${i}] type="${type}" placeholder="${placeholder}" value="${value}"`);
    }

    console.log('\n=== PAGE TEXT CONTENT ===\n');
    const pageText = await page.evaluate(() => document.documentElement.innerText);
    console.log(pageText.substring(0, 800));

    console.log('\n=== CHECKING DEMO WORKFLOW ===\n');
    if (pageText.includes('Enterprise Lead')) {
      console.log('✓ Demo workflow name found');
    } else {
      console.log('✗ Demo workflow name NOT found');
    }

    if (pageText.includes('12')) {
      console.log('✓ Step count "12" found');
    } else {
      console.log('✗ Step count "12" NOT found');
    }

    if (pageText.includes('13')) {
      console.log('✓ Connection count "13" found');
    } else {
      console.log('✗ Connection count "13" NOT found');
    }

    console.log('\n=== CHECKING SIDEBAR ===\n');
    const sidebarElements = await page.locator('[class*="sidebar"], [class*="left"], [class*="panel"]').all();
    console.log(`Sidebar-like elements found: ${sidebarElements.length}`);

    console.log('\n=== ALL TEXT HEADINGS ===\n');
    const h2s = await page.locator('h2, h3').all();
    for (let i = 0; i < h2s.length; i++) {
      const text = await h2s[i].innerText();
      console.log(`  ${text}`);
    }

    console.log('\n=== CHECKING WORKFLOW NAME DISPLAY ===\n');
    const allText = await page.evaluate(() => Array.from(document.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      text: el.innerText?.substring(0, 50),
      classes: el.className,
    })).filter(el => el.text?.includes('Enterprise') || el.text?.includes('Lead Intake')));

    console.log(JSON.stringify(allText, null, 2));

  } finally {
    await browser.close();
  }
}

debugEditor();
