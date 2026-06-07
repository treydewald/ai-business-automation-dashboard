import { chromium } from 'playwright';

async function debugTeleport() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  try {
    console.log('=== DEBUGGING NODE TELEPORT ISSUE ===\n');

    await page.goto('http://localhost:4173/workflows/wf-lead-intake/edit', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Step 1: Recording initial node positions...\n');

    const initialPositions = await page.evaluate(() => {
      const nodes: any = {};
      const nodeElements = document.querySelectorAll('[data-id]');

      nodeElements.forEach((el) => {
        const id = (el as any)['data-id'];
        const rect = el.getBoundingClientRect();
        nodes[id] = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      });

      return nodes;
    });

    console.log(`Found ${Object.keys(initialPositions).length} nodes`);
    Object.entries(initialPositions).slice(0, 3).forEach(([id, pos]) => {
      console.log(`  ${id}: x=${(pos as any).x.toFixed(0)}, y=${(pos as any).y.toFixed(0)}`);
    });

    console.log('\nStep 2: Clicking first node to select it...\n');

    const firstNodeId = Object.keys(initialPositions)[0];
    if (firstNodeId) {
      const nodeLocator = page.locator(`[data-id="${firstNodeId}"]`).first();
      await nodeLocator.click();
      await page.waitForTimeout(300);

      console.log('Step 3: Recording node positions after click...\n');

      const afterPositions = await page.evaluate(() => {
        const nodes: any = {};
        const nodeElements = document.querySelectorAll('[data-id]');

        nodeElements.forEach((el) => {
          const id = (el as any)['data-id'];
          const rect = el.getBoundingClientRect();
          nodes[id] = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
        });

        return nodes;
      });

      console.log('Position comparison after click:');

      let teleportDetected = false;
      Object.entries(afterPositions).slice(0, 5).forEach(([id, pos]) => {
        const before = (initialPositions as any)[id];
        if (before) {
          const xDiff = Math.abs((pos as any).x - before.x);
          const yDiff = Math.abs((pos as any).y - before.y);
          const moved = xDiff > 5 || yDiff > 5; // More than 5px difference

          if (moved) {
            console.log(`  ${id}: MOVED ${xDiff.toFixed(0)}px (x), ${yDiff.toFixed(0)}px (y) ❌`);
            teleportDetected = true;
          } else {
            console.log(`  ${id}: stable ✓`);
          }
        }
      });

      if (teleportDetected) {
        console.log('\n❌ NODE TELEPORT DETECTED - Investigating cause...\n');

        // Check if fitView was called
        console.log('Step 4: Checking ReactFlow behavior...\n');

        const reactFlowState = await page.evaluate(() => {
          // Try to detect if fitView was called
          const container = document.querySelector('.react-flow__pane');
          if (container) {
            const style = (container as any).style;
            return {
              transform: style.transform,
              display: style.display,
            };
          }
          return null;
        });

        console.log('ReactFlow pane state:', reactFlowState);

        console.log('\nStep 5: Checking React state updates...\n');

        // Check console for errors
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });

        await page.waitForTimeout(500);

        if (errors.length > 0) {
          console.log('Console errors found:');
          errors.forEach(e => console.log(`  - ${e}`));
        } else {
          console.log('No console errors detected');
        }

        console.log('\n=== ANALYSIS ===');
        console.log('Root cause: Node positions are changing when nodes are selected.');
        console.log('This suggests:');
        console.log('  1. setNodes is being called with position changes');
        console.log('  2. fitView is being triggered unexpectedly');
        console.log('  3. ReactFlow is re-rendering nodes with new positions');
      } else {
        console.log('\n✅ Nodes remain stable after click');
      }
    }

  } finally {
    await browser.close();
  }
}

debugTeleport();
