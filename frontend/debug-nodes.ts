import { chromium } from 'playwright';

async function debugNodes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for demo to load

    console.log('=== NODE POSITIONS AND VISIBILITY ===\n');

    const nodeInfo = await page.evaluate(() => {
      const nodes = document.querySelectorAll('[data-id]');
      const result: any[] = [];

      nodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        const computed = getComputedStyle(node);

        result.push({
          id: (node as any)['data-id'],
          visible: rect.width > 0 && rect.height > 0,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          innerHTML: (node as HTMLElement).innerHTML.substring(0, 50),
        });
      });

      return result;
    });

    console.log(JSON.stringify(nodeInfo, null, 2));

    console.log('\n=== CHECKING REACTFLOW CONTAINER ===\n');

    const containerInfo = await page.evaluate(() => {
      const container = document.querySelector('.react-flow__renderer');
      if (!container) return 'Container not found';

      const rect = container.getBoundingClientRect();
      return {
        exists: true,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        childCount: container.children.length,
        visible: rect.width > 0 && rect.height > 0,
      };
    });

    console.log(JSON.stringify(containerInfo, null, 2));

    console.log('\n=== FORCING FIT VIEW ===\n');

    // Try to trigger fitView if it exists
    const fitViewResult = await page.evaluate(() => {
      // Try to access React internals
      const nodes = document.querySelectorAll('[data-id]');
      if (nodes.length > 0) {
        return `Found ${nodes.length} nodes`;
      }
      return 'No nodes found';
    });

    console.log(fitViewResult);

    console.log('\n=== CHECKING PAGE HTML STRUCTURE ===\n');

    const htmlStructure = await page.evaluate(() => {
      const body = document.body;
      const divs = body.querySelectorAll('div[style*="height: 100%"]');

      return {
        totalDivs: divs.length,
        mainCanvasDiv: Array.from(divs).map(div => ({
          className: div.className,
          hasChildren: div.children.length > 0,
          firstChildTag: div.children[0]?.tagName,
        })),
      };
    });

    console.log(JSON.stringify(htmlStructure, null, 2));

  } finally {
    await browser.close();
  }
}

debugNodes();
