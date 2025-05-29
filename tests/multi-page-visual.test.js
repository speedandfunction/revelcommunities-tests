// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Base URLs
const PRODUCTION_BASE = 'https://revelcommunities.com';
const DEVELOPMENT_BASE = 'https://dev-revelcommunities.pantheonsite.io';

// Pages to test - add your URLs here
const PAGES_TO_TEST = [
  '/', // Homepage
  '/communities/',
  '/communities/eagle/',
  '/communities/eagle/site-map/'
];

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

// Create screenshots directory
const SCREENSHOTS_DIR = 'test-results/screenshots';

test.describe('Multi-Page Visual Comparison Tests', () => {
  // Function to hide cookie banner
  async function hideCookieBanner(page) {
    await page.evaluate(() => {
      const cookieBanner = document.querySelector('.cky-consent-container');
      if (cookieBanner instanceof HTMLElement) {
        cookieBanner.style.display = 'none';
      }
    });
  }

  // Function to handle any forms on the page
  async function handleForms(page) {
    try {
      const forms = await page.$$('form');
      for (const form of forms) {
        const requiredFields = await form.$$('input[required]');
        for (const field of requiredFields) {
          await field.type('test');
        }
      }
    } catch (error) {
      console.log('No forms to handle on this page');
    }
  }

  // Function to get a safe filename from URL
  function getPageIdentifier(url) {
    return url.replace(/\//g, '_').replace(/^_+|_+$/g, '') || 'homepage';
  }

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    try {
      await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
      console.log(`📁 Created screenshots directory: ${SCREENSHOTS_DIR}`);
    } catch (error) {
      console.log(`📁 Screenshots directory already exists: ${SCREENSHOTS_DIR}`);
    }
  });

  // Test 1: Simple screenshot capture and basic comparison for all pages
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    for (const pageUrl of PAGES_TO_TEST) {
      test(`📸 Capture screenshots - ${device} - ${getPageIdentifier(pageUrl)}`, async ({ page }) => {
        const pageId = getPageIdentifier(pageUrl);
        console.log(`\n🔍 Starting ${device} comparison for ${pageUrl} (${viewport.width}x${viewport.height})`);
        
        // Set viewport
        await page.setViewportSize(viewport);

        const productionUrl = `${PRODUCTION_BASE}${pageUrl}`;
        const developmentUrl = `${DEVELOPMENT_BASE}${pageUrl}`;

        // Test Production environment
        console.log(`📷 Testing production: ${productionUrl}`);
        await page.goto(productionUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await hideCookieBanner(page);
        await handleForms(page);
        await page.waitForTimeout(2000);
        
        const prodScreenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        
        const prodPath = path.join(SCREENSHOTS_DIR, `${device}-${pageId}-production.png`);
        await fs.writeFile(prodPath, prodScreenshot);
        console.log(`✅ Production screenshot saved: ${prodPath}`);

        // Test Development environment
        console.log(`📷 Testing development: ${developmentUrl}`);
        await page.goto(developmentUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await hideCookieBanner(page);
        await handleForms(page);
        await page.waitForTimeout(2000);
        
        const devScreenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        
        const devPath = path.join(SCREENSHOTS_DIR, `${device}-${pageId}-development.png`);
        await fs.writeFile(devPath, devScreenshot);
        console.log(`✅ Development screenshot saved: ${devPath}`);

        // Simple byte comparison
        const isIdentical = prodScreenshot.equals(devScreenshot);
        
        // Save comparison result
        const comparisonResult = {
          device,
          pageUrl,
          pageId,
          viewport,
          timestamp: new Date().toISOString(),
          productionUrl,
          developmentUrl,
          identical: isIdentical,
          productionScreenshotPath: prodPath,
          developmentScreenshotPath: devPath
        };

        const resultPath = path.join(SCREENSHOTS_DIR, `${device}-${pageId}-result.json`);
        await fs.writeFile(resultPath, JSON.stringify(comparisonResult, null, 2));

        if (isIdentical) {
          console.log(`✅ ${device} - ${pageId}: Screenshots are identical`);
        } else {
          console.log(`⚠️  ${device} - ${pageId}: Screenshots differ`);
        }
      });
    }
  }

  // Test 2: Generate comprehensive HTML report for all pages
  test('📊 Generate multi-page comparison report', async ({ page }) => {
    console.log('\n📊 Generating multi-page visual comparison report...');
    
    const reportData = [];
    
    for (const pageUrl of PAGES_TO_TEST) {
      const pageId = getPageIdentifier(pageUrl);
      const productionUrl = `${PRODUCTION_BASE}${pageUrl}`;
      const developmentUrl = `${DEVELOPMENT_BASE}${pageUrl}`;
      
      console.log(`📋 Processing ${pageUrl} for report...`);
      
      const pageData = {
        pageUrl,
        pageId,
        productionUrl,
        developmentUrl,
        devices: []
      };

      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        console.log(`  📱 Processing ${device} for ${pageUrl}...`);
        
        await page.setViewportSize(viewport);

        // Production
        await page.goto(productionUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await page.waitForTimeout(2000);
        await hideCookieBanner(page);
        const prodScreenshot = await page.screenshot({ 
          fullPage: true, 
          animations: 'disabled' 
        });

        // Development  
        await page.goto(developmentUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await page.waitForTimeout(2000);
        await hideCookieBanner(page);
        const devScreenshot = await page.screenshot({ 
          fullPage: true, 
          animations: 'disabled' 
        });

        // Save with report prefix
        const prodPath = path.join(SCREENSHOTS_DIR, `report-${device}-${pageId}-production.png`);
        const devPath = path.join(SCREENSHOTS_DIR, `report-${device}-${pageId}-development.png`);
        
        await fs.writeFile(prodPath, prodScreenshot);
        await fs.writeFile(devPath, devScreenshot);

        const isIdentical = prodScreenshot.equals(devScreenshot);

        pageData.devices.push({
          device,
          viewport,
          isIdentical,
          prodPath: path.basename(prodPath),
          devPath: path.basename(devPath)
        });
      }

      reportData.push(pageData);
    }

    // Generate HTML report
    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Page Visual Comparison Report</title>
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
        .page-section {
            margin-bottom: 40px;
        }
        .page-header {
            background: #3498db;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .page-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        .page-urls {
            font-size: 14px;
            opacity: 0.9;
        }
        .comparison-grid {
            display: grid;
            gap: 20px;
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
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .device-title {
            font-size: 16px;
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
            padding: 15px;
            text-align: center;
        }
        .env-label {
            font-weight: 600;
            margin-bottom: 10px;
            color: #2c3e50;
            font-size: 14px;
        }
        .screenshot-container img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .viewport-info {
            font-size: 12px;
            color: #95a5a6;
        }
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .summary h2 {
            margin: 0 0 15px 0;
            color: #2c3e50;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .stat-card {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
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
        <h1>🔍 Multi-Page Visual Comparison Report</h1>
        <div class="meta">
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Production Base: ${PRODUCTION_BASE}</div>
            <div>Development Base: ${DEVELOPMENT_BASE}</div>
            <div>Pages Tested: ${PAGES_TO_TEST.length}</div>
        </div>
    </div>

    ${reportData.map(pageData => `
        <div class="page-section">
            <div class="page-header">
                <div class="page-title">${pageData.pageUrl}</div>
                <div class="page-urls">
                    <div>🟢 ${pageData.productionUrl}</div>
                    <div>🔵 ${pageData.developmentUrl}</div>
                </div>
            </div>
            
            <div class="comparison-grid">
                ${pageData.devices.map(deviceData => `
                    <div class="comparison-card">
                        <div class="card-header">
                            <div>
                                <div class="device-title">${deviceData.device}</div>
                                <div class="viewport-info">${deviceData.viewport.width} × ${deviceData.viewport.height}</div>
                            </div>
                            <div class="status ${deviceData.isIdentical ? 'identical' : 'different'}">
                                ${deviceData.isIdentical ? '✓ IDENTICAL' : '⚠ DIFFERENT'}
                            </div>
                        </div>
                        <div class="screenshots">
                            <div class="screenshot-container">
                                <div class="env-label">🟢 Production</div>
                                <img src="${deviceData.prodPath}" alt="Production ${deviceData.device}" loading="lazy">
                            </div>
                            <div class="screenshot-container">
                                <div class="env-label">🔵 Development</div>
                                <img src="${deviceData.devPath}" alt="Development ${deviceData.device}" loading="lazy">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}

    <div class="summary">
        <h2>📈 Summary Statistics</h2>
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-number">${PAGES_TO_TEST.length}</div>
                <div class="stat-label">Pages Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(VIEWPORTS).length}</div>
                <div class="stat-label">Device Types</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.reduce((total, page) => total + page.devices.filter(d => d.isIdentical).length, 0)}</div>
                <div class="stat-label">Identical Comparisons</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.reduce((total, page) => total + page.devices.filter(d => !d.isIdentical).length, 0)}</div>
                <div class="stat-label">Different Comparisons</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(SCREENSHOTS_DIR, 'multi-page-comparison-report.html');
    await fs.writeFile(reportPath, reportHtml);
    
    console.log(`\n📊 Multi-page report generated successfully!`);
    console.log(`📂 Location: ${reportPath}`);
    console.log(`🌐 Open in browser: file://${path.resolve(reportPath)}`);
    
    // Generate summary
    let totalComparisons = 0;
    let identicalCount = 0;
    let differentCount = 0;
    
    reportData.forEach(pageData => {
      pageData.devices.forEach(deviceData => {
        totalComparisons++;
        if (deviceData.isIdentical) {
          identicalCount++;
        } else {
          differentCount++;
        }
      });
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   📄 Pages tested: ${PAGES_TO_TEST.length}`);
    console.log(`   📱 Device types: ${Object.keys(VIEWPORTS).length}`);
    console.log(`   ✅ Identical: ${identicalCount}`);
    console.log(`   ⚠️  Different: ${differentCount}`);
    console.log(`   📊 Total comparisons: ${totalComparisons}`);
  });

  // Test 3: Playwright's built-in visual comparison for all pages
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    for (const pageUrl of PAGES_TO_TEST) {
      test(`🎯 Playwright visual comparison - ${device} - ${getPageIdentifier(pageUrl)}`, async ({ page }) => {
        const pageId = getPageIdentifier(pageUrl);
        console.log(`\n🎯 Running Playwright visual comparison for ${device} - ${pageUrl}...`);
        
        await page.setViewportSize(viewport);

        const productionUrl = `${PRODUCTION_BASE}${pageUrl}`;
        const developmentUrl = `${DEVELOPMENT_BASE}${pageUrl}`;

        // Take production screenshot as baseline
        console.log(`📷 Creating ${device} baseline for ${pageUrl}...`);
        await page.goto(productionUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await page.waitForTimeout(3000);

        await hideCookieBanner(page);
        const prodScreenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        const prodSnapshotPath = path.join(SCREENSHOTS_DIR, `playwright-${device}-${pageId}-production.png`);
        await fs.writeFile(prodSnapshotPath, prodScreenshot);
        console.log(`✅ Playwright production saved: ${prodSnapshotPath}`);

        // This creates the baseline for comparison
        await expect(page).toHaveScreenshot(`${device}-${pageId}-production-baseline.png`, {
          fullPage: true,
          animations: 'disabled'
        });

        // Now test development against the baseline
        console.log(`🔍 Taking ${device} development screenshot for ${pageUrl}...`);
        await page.goto(developmentUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await page.waitForTimeout(3000);

        await hideCookieBanner(page);
        const devScreenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        const devSnapshotPath = path.join(SCREENSHOTS_DIR, `playwright-${device}-${pageId}-development.png`);
        await fs.writeFile(devSnapshotPath, devScreenshot);
        console.log(`✅ Playwright development saved: ${devSnapshotPath}`);

        // This compares development against the production baseline
        await expect(page).toHaveScreenshot(`${device}-${pageId}-production-baseline.png`, {
          fullPage: true,
          animations: 'disabled',
          threshold: 0.1, // 10% threshold
          maxDiffPixels: 1000
        });

        console.log(`✅ ${device} - ${pageId} comparison completed`);
      });
    }
  }
});