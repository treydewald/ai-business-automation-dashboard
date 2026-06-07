import { chromium } from 'playwright';

async function debugCanvas() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });

    console.log('=== WAITING FOR DEMO WORKFLOW TO LOAD ===\n');
    await page.waitForTimeout(3000); // Wait 3 seconds for demo to load

    console.log('=== CHECKING CANVAS NODES ===\n');

    // Check ReactFlow canvas nodes
    const nodeElements = await page.locator('[data-id]').all(); // ReactFlow nodes have data-id
    console.log(`Nodes in canvas: ${nodeElements.length}`);

    // Check SVG elements in canvas
    const svgElements = await page.locator('svg').all();
    console.log(`SVG elements: ${svgElements.length}`);

    // Check for step nodes
    const stepNodes = await page.locator('[class*="node"]').all();
    console.log(`Step node elements: ${stepNodes.length}`);

    console.log('\n=== CHECKING WORKFLOW STATE ===\n');

    // Check the summary panel
    const stepsText = await page.locator('text=STEPS').first().evaluate(el => el.parentElement?.innerText);
    console.log(`Steps panel text:\n${stepsText}`);

    const connectionsText = await page.locator('text=CONNECTIONS').first().evaluate(el => el.parentElement?.innerText);
    console.log(`\nConnections panel text:\n${connectionsText}`);

    console.log('\n=== CHECKING CANVAS DIV ===\n');

    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('[style*="height: 100%"]');
      if (!canvas) return 'Canvas not found';

      const html = canvas.innerHTML;
      return {
        hasContent: html.length > 100,
        contentLength: html.length,
        hasReactFlow: html.includes('react-flow'),
        hasSVG: html.includes('<svg'),
        childCount: canvas.children.length,
      };
    });

    console.log(JSON.stringify(canvasInfo, null, 2));

    console.log('\n=== CHECKING CONSOLE ERRORS ===\n');

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(500);

    if (errors.length > 0) {
      console.log('Errors found:');
      errors.forEach(e => console.log(`  - ${e}`));
    } else {
      console.log('No console errors');
    }

    console.log('\n=== CHECKING BROWSER CONTEXT ===\n');

    // Try to see if we can access the workflow editor state directly
    const editorState = await page.evaluate(() => {
      // Try to find any React state in window object
      const keys = Object.keys(window as any).filter(k =>
        k.includes('__react') || k.includes('state') || k.includes('editor')
      );
      return keys;
    });

    console.log(`Window keys related to state: ${editorState.join(', ')}`);

  } finally {
    await browser.close();
  }
}

debugCanvas();
