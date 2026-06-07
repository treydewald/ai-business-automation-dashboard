import { chromium } from 'playwright';

async function debugEditor() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('=== CHECKING WORKFLOW NAME INPUT ===\n');

    const nameInput = await page.locator('input[placeholder="Workflow name (required)"]').first();
    const value = await nameInput.inputValue();
    const displayed = await nameInput.evaluate(el => el.value);

    console.log(`Input value: "${value}"`);
    console.log(`Displayed value: "${displayed}"`);

    console.log('\n=== CHECKING WORKFLOW SUMMARY ===\n');
    const summaryText = await page.evaluate(() => document.documentElement.innerText);
    const lines = summaryText.split('\n');

    console.log('Text around STEPS:');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('STEPS')) {
        console.log(`  [${i-1}] ${lines[i-1]}`);
        console.log(`  [${i}] ${lines[i]}`);
        console.log(`  [${i+1}] ${lines[i+1]}`);
        console.log(`  [${i+2}] ${lines[i+2]}`);
      }
    }

    console.log('\nText around CONNECTIONS:');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('CONNECTIONS')) {
        console.log(`  [${i-1}] ${lines[i-1]}`);
        console.log(`  [${i}] ${lines[i]}`);
        console.log(`  [${i+1}] ${lines[i+1]}`);
        console.log(`  [${i+2}] ${lines[i+2]}`);
      }
    }

    console.log('\n=== SUCCESS MESSAGE ===\n');
    if (summaryText.includes('Professional demo')) {
      console.log('✓ Success message found');
    } else if (summaryText.includes('Success')) {
      console.log('✓ Success indicator found');
    }

  } finally {
    await browser.close();
  }
}

debugEditor();
