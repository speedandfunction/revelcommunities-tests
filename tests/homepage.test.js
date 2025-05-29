// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// URLs to compare
const PRODUCTION_URL = 'https://revelcommunities.com';
const DEVELOPMENT_URL = 'https://dev-revelcomm.pantheonsite.io';

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

// Create screenshots directory
const SCREENSHOTS_DIR = 'test-results/screenshots';

test.describe('Visual Comparison Tests', () => {
  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    try {
      await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
      console.log(`📁 Created screenshots directory: ${SCREENSHOTS_DIR}`);
    } catch (error) {
      console.log(`📁 Screenshots directory already exists: ${SCREENSHOTS_DIR}`);
    }
  });

  // Test 1: Simple screenshot capture and basic comparison
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test(`📸 Capture screenshots - ${device}`, async ({ page }) => {
      console.log(`\n🔍 Starting ${device} comparison (${viewport.width}x${viewport.height})`);
      
      // Set viewport
      await page.setViewportSize(viewport);

      // Capture Production screenshot
      console.log(`📷 Capturing production screenshot...`);
      await page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(3000); // Extra wait for dynamic content
      
      const prodScreenshot = await page.screenshot({ 
        fullPage: true,
        animations: 'disabled'
      });
      
      const prodPath = path.join(SCREENSHOTS_DIR, `${device}-production.png`);
      await fs.writeFile(prodPath, prodScreenshot);
      console.log(`✅ Production saved: ${prodPath}`);

      // Capture Development screenshot
      console.log(`📷 Capturing development screenshot...`);
      await page.goto(DEVELOPMENT_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(3000); // Extra wait for dynamic content
      
      const devScreenshot = await page.screenshot({ 
        fullPage: true,
        animations: 'disabled'
      });
      
      const devPath = path.join(SCREENSHOTS_DIR, `${device}-development.png`);
      await fs.writeFile(devPath, devScreenshot);
      console.log(`✅ Development saved: ${devPath}`);

      // Simple byte comparison
      const isIdentical = prodScreenshot.equals(devScreenshot);
      
      // Save comparison result
      const comparisonResult = {
        device,
        viewport,
        timestamp: new Date().toISOString(),
        productionUrl: PRODUCTION_URL,
        developmentUrl: DEVELOPMENT_URL,
        identical: isIdentical,
        productionScreenshotPath: prodPath,
        developmentScreenshotPath: devPath
      };

      const resultPath = path.join(SCREENSHOTS_DIR, `${device}-result.json`);
      await fs.writeFile(resultPath, JSON.stringify(comparisonResult, null, 2));

      if (isIdentical) {
        console.log(`✅ ${device}: Screenshots are identical`);
      } else {
        console.log(`⚠️  ${device}: Screenshots differ`);
      }
    });
  }

  // Test 2: Generate comprehensive HTML report
  test('📊 Generate comparison report', async ({ page }) => {
    console.log('\n📊 Generating visual comparison report...');
    
    const reportData = [];
    
    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      console.log(`📋 Processing ${device} for report...`);
      
      await page.setViewportSize(viewport);

      // Production
      await page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(2000);
      const prodScreenshot = await page.screenshot({ 
        fullPage: true, 
        animations: 'disabled' 
      });

      // Development  
      await page.goto(DEVELOPMENT_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(2000);
      const devScreenshot = await page.screenshot({ 
        fullPage: true, 
        animations: 'disabled' 
      });

      // Save with report prefix
      const prodPath = path.join(SCREENSHOTS_DIR, `report-${device}-production.png`);
      const devPath = path.join(SCREENSHOTS_DIR, `report-${device}-development.png`);
      
      await fs.writeFile(prodPath, prodScreenshot);
      await fs.writeFile(devPath, devScreenshot);

      const isIdentical = prodScreenshot.equals(devScreenshot);

      reportData.push({
        device,
        viewport,
        isIdentical,
        prodPath: path.basename(prodPath),
        devPath: path.basename(devPath)
      });
    }

    // Generate HTML report
    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Comparison Report</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .header .meta {
            color: #7f8c8d;
            font-size: 14px;
        }
        .comparison-grid {
            display: grid;
            gap: 30px;
        }
        .comparison-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card-header {
            background: #34495e;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .device-title {
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status.identical {
            background: #27ae60;
            color: white;
        }
        .status.different {
            background: #e74c3c;
            color: white;
        }
        .screenshots {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }
        .screenshot-container {
            padding: 20px;
            text-align: center;
        }
        .env-label {
            font-weight: 600;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .screenshot-container img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .url {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 8px;
            word-break: break-all;
        }
        .viewport-info {
            font-size: 12px;
            color: #95a5a6;
        }
        @media (max-width: 768px) {
            .screenshots {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Visual Comparison Report</h1>
        <div class="meta">
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Production: ${PRODUCTION_URL}</div>
            <div>Development: ${DEVELOPMENT_URL}</div>
        </div>
    </div>

    <div class="comparison-grid">
        ${reportData.map(data => `
            <div class="comparison-card">
                <div class="card-header">
                    <div>
                        <div class="device-title">${data.device}</div>
                        <div class="viewport-info">${data.viewport.width} × ${data.viewport.height}</div>
                    </div>
                    <div class="status ${data.isIdentical ? 'identical' : 'different'}">
                        ${data.isIdentical ? '✓ IDENTICAL' : '⚠ DIFFERENT'}
                    </div>
                </div>
                <div class="screenshots">
                    <div class="screenshot-container">
                        <div class="env-label">🟢 Production</div>
                        <img src="${data.prodPath}" alt="Production ${data.device}" loading="lazy">
                        <div class="url">${PRODUCTION_URL}</div>
                    </div>
                    <div class="screenshot-container">
                        <div class="env-label">🔵 Development</div>
                        <img src="${data.devPath}" alt="Development ${data.device}" loading="lazy">
                        <div class="url">${DEVELOPMENT_URL}</div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    const reportPath = path.join(SCREENSHOTS_DIR, 'comparison-report.html');
    await fs.writeFile(reportPath, reportHtml);
    
    console.log(`\n📊 Report generated successfully!`);
    console.log(`📂 Location: ${reportPath}`);
    console.log(`🌐 Open in browser: file://${path.resolve(reportPath)}`);
    
    // Generate summary
    const identical = reportData.filter(d => d.isIdentical).length;
    const different = reportData.filter(d => !d.isIdentical).length;
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Identical: ${identical}`);
    console.log(`   ⚠️  Different: ${different}`);
    console.log(`   📊 Total: ${reportData.length}`);
  });

  // Test 3: Playwright's built-in visual comparison - FIXED VERSION
  // Create separate tests for each device instead of looping inside one test
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test(`🎯 Playwright visual comparison - ${device}`, async ({ page }) => {
      console.log(`\n🎯 Running Playwright visual comparison for ${device}...`);
      
      await page.setViewportSize(viewport);

      // Take production screenshot as baseline
      console.log(`📷 Creating ${device} baseline from production...`);
      await page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(3000);

      // Save production screenshot with unique name
      const prodScreenshot = await page.screenshot({ 
        fullPage: true,
        animations: 'disabled'
      });
      const prodSnapshotPath = path.join(SCREENSHOTS_DIR, `playwright-${device}-production.png`);
      await fs.writeFile(prodSnapshotPath, prodScreenshot);
      console.log(`✅ Playwright production saved: ${prodSnapshotPath}`);

      // This creates the baseline for comparison
      await expect(page).toHaveScreenshot(`${device}-production-baseline.png`, {
        fullPage: true,
        animations: 'disabled'
      });

      // Now test development against the baseline
      console.log(`🔍 Taking ${device} development screenshot...`);
      await page.goto(DEVELOPMENT_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(3000);

      // Save development screenshot with unique name
      const devScreenshot = await page.screenshot({ 
        fullPage: true,
        animations: 'disabled'
      });
      const devSnapshotPath = path.join(SCREENSHOTS_DIR, `playwright-${device}-development.png`);
      await fs.writeFile(devSnapshotPath, devScreenshot);
      console.log(`✅ Playwright development saved: ${devSnapshotPath}`);

      // This compares development against the production baseline
      await expect(page).toHaveScreenshot(`${device}-production-baseline.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.1, // 10% threshold
        maxDiffPixels: 1000
      });

      console.log(`✅ ${device} comparison completed`);
    });
  }
});