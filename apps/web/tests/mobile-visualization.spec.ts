import { test, expect, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_ISO_ID = '1i-oumuamua'

/**
 * Mobile Visualization Testing
 *
 * Tests the orbital visualization (trajectory and planets) on mobile viewports
 * to identify rendering issues with planet positions and visibility.
 */

test('Desktop: should render orbital visualization correctly', async ({ page }) => {
  // Go to ISO detail page
  await page.goto(`${BASE_URL}/iso-objects/${TEST_ISO_ID}`)
  await page.waitForTimeout(2000)

  // Click on Orbital tab
  const orbitalTab = page.locator('button:has-text("Orbital")')
  if (await orbitalTab.isVisible()) {
    await orbitalTab.click()
    await page.waitForTimeout(2000) // Wait for canvas to render

    // Wait for canvas to be visible
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: '/Users/jamiewatters/DevProjects/ISOTracker/apps/web/test-results/desktop-orbital-visualization.png',
      fullPage: true
    })

    // Verify canvas has expected dimensions
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).toBeTruthy()
    expect(canvasBox!.width).toBeGreaterThan(400)

    console.log('Desktop canvas dimensions:', canvasBox)
  }
})

test('iPhone 12: should render orbital visualization', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['iPhone 12']
  })
  const page = await context.newPage()

  // Go to ISO detail page
  await page.goto(`${BASE_URL}/iso-objects/${TEST_ISO_ID}`)
  await page.waitForTimeout(2000)

  // Click on Orbital tab
  const orbitalTab = page.locator('button:has-text("Orbital")')
  if (await orbitalTab.isVisible()) {
    await orbitalTab.click()
    await page.waitForTimeout(2000)

    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: 'test-results/iphone12-orbital-visualization.png',
      fullPage: true
    })

    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox()
    console.log('iPhone 12 canvas dimensions:', canvasBox)
    console.log('iPhone 12 viewport:', await page.viewportSize())

    // Verify controls are accessible
    const zoomOut = page.locator('button:has-text("Zoom Out")')
    const zoomIn = page.locator('button:has-text("Zoom In")')
    await expect(zoomOut).toBeVisible()
    await expect(zoomIn).toBeVisible()

    // Test zoom interaction
    await zoomIn.click()
    await page.waitForTimeout(1000)
    await page.screenshot({
      path: 'test-results/iphone12-orbital-zoomed.png',
      fullPage: true
    })
  }

  await context.close()
})

test('iPhone SE: should render orbital visualization on small screen', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['iPhone SE']
  })
  const page = await context.newPage()

  // Go to ISO detail page
  await page.goto(`${BASE_URL}/iso-objects/${TEST_ISO_ID}`)
  await page.waitForTimeout(2000)

  // Click on Orbital tab
  const orbitalTab = page.locator('button:has-text("Orbital")')
  if (await orbitalTab.isVisible()) {
    await orbitalTab.click()
    await page.waitForTimeout(2000)

    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: 'test-results/iphonese-orbital-visualization.png',
      fullPage: true
    })

    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox()
    console.log('iPhone SE canvas dimensions:', canvasBox)
    console.log('iPhone SE viewport:', await page.viewportSize())
  }

  await context.close()
})

test('Pixel 5: should render orbital visualization on Android', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['Pixel 5']
  })
  const page = await context.newPage()

  // Go to ISO detail page
  await page.goto(`${BASE_URL}/iso-objects/${TEST_ISO_ID}`)
  await page.waitForTimeout(2000)

  // Click on Orbital tab
  const orbitalTab = page.locator('button:has-text("Orbital")')
  if (await orbitalTab.isVisible()) {
    await orbitalTab.click()
    await page.waitForTimeout(2000)

    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: 'test-results/pixel5-orbital-visualization.png',
      fullPage: true
    })

    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox()
    console.log('Pixel 5 canvas dimensions:', canvasBox)
    console.log('Pixel 5 viewport:', await page.viewportSize())

    // Test touch interactions
    const timeSlider = page.locator('input[type="range"]')
    await expect(timeSlider).toBeVisible()
  }

  await context.close()
})

test('iPad Mini: should render orbital visualization on tablet', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['iPad Mini']
  })
  const page = await context.newPage()

  // Go to ISO detail page
  await page.goto(`${BASE_URL}/iso-objects/${TEST_ISO_ID}`)
  await page.waitForTimeout(2000)

  // Click on Orbital tab
  const orbitalTab = page.locator('button:has-text("Orbital")')
  if (await orbitalTab.isVisible()) {
    await orbitalTab.click()
    await page.waitForTimeout(2000)

    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: 'test-results/ipadmini-orbital-visualization.png',
      fullPage: true
    })

    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox()
    console.log('iPad Mini canvas dimensions:', canvasBox)
    console.log('iPad Mini viewport:', await page.viewportSize())
  }

  await context.close()
})
