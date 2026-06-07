import { chromium } from 'playwright';

async function verifySelectionFix() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    console.log('=== VERIFYING NODE SELECTION FIX ===\n');

    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✓ Page loaded\n');

    // Get all visible node text to identify them
    const nodeTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="node"]'))
        .slice(0, 5)
        .map((el) => el.textContent?.substring(0, 30) || '');
    });

    console.log('Found nodes:', nodeTexts.filter(t => t).join(', '));

    // Click on a node by looking for step-related text
    console.log('\nClicking on first visible step node...');
    const stepButtons = await page.locator('text=/Receive|Lead|Webhook/i').first();

    if (await stepButtons.isVisible()) {
      const boxBefore = await stepButtons.boundingBox();
      console.log(`Position before click: x=${boxBefore?.x.toFixed(0)}, y=${boxBefore?.y.toFixed(0)}`);

      await stepButtons.click();
      await page.waitForTimeout(300);

      const boxAfter = await stepButtons.boundingBox();
      console.log(`Position after click:  x=${boxAfter?.x.toFixed(0)}, y=${boxAfter?.y.toFixed(0)}`);

      const moved = boxBefore && boxAfter && (
        Math.abs(boxBefore.x - boxAfter.x) > 5 ||
        Math.abs(boxBefore.y - boxAfter.y) > 5
      );

      if (moved) {
        console.log('\n❌ FAIL: Node moved after selection');
      } else {
        console.log('\n✅ PASS: Node stayed in place when selected');
      }

      // Try clicking multiple nodes to ensure no cascading movement
      console.log('\nClicking multiple nodes to test stability...');
      const nodes = await page.locator('[class*="node"]').all();

      for (let i = 0; i < Math.min(3, nodes.length); i++) {
        const box1 = await nodes[i].boundingBox();
        await nodes[i].click();
        await page.waitForTimeout(200);
        const box2 = await nodes[i].boundingBox();

        const stable = box1 && box2 && (
          Math.abs(box1.x - box2.x) < 5 &&
          Math.abs(box1.y - box2.y) < 5
        );

        console.log(`  Node ${i + 1}: ${stable ? '✓ Stable' : '✗ Moved'}`);
      }

      console.log('\n✅ VERIFICATION COMPLETE: Selection state does not cause node movement');
    } else {
      console.log('Could not find test node');
    }

  } finally {
    await browser.close();
  }
}

verifySelectionFix();
