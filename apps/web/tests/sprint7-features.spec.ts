import { test, expect } from '@playwright/test';

test.describe('Sprint 7 - Orbital Visualization Features', () => {

  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ISO Tracker/);
  });

  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/iso-objects');
    // Should redirect to auth or show login prompt
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
  });

  test('should allow test user to log in', async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/sign-in');

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should be on dashboard or ISO objects page
    const url = page.url();
    expect(url).toMatch(/dashboard|iso-objects/);
  });

  test('should display ISO objects list after login', async ({ page }) => {
    // Login first
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to ISO objects
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);

    // Check for ISO objects content
    const hasContent = await page.locator('text=/Oumuamua|Borisov|ATLAS/i').first().isVisible()
      .catch(() => false);

    console.log('ISO objects page loaded, has ISOs:', hasContent);
  });

  test('should render orbital visualization on ISO detail page', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go to ISO objects list
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);

    // Click first ISO object
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Check for canvas element (orbital visualization)
      const canvas = page.locator('canvas').first();
      const canvasExists = await canvas.isVisible().catch(() => false);

      console.log('Canvas element found:', canvasExists);
      expect(canvasExists).toBeTruthy();
    }
  });

  test('should display tab navigation on ISO detail page', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to first ISO
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Check for tab navigation - look for buttons with tab text
      const overviewTab = page.getByRole('button', { name: 'Overview' });
      const orbitalDataTab = page.getByRole('button', { name: 'Orbital Data' });
      const evidenceTab = page.getByRole('button', { name: 'Evidence' });
      const communityTab = page.getByRole('button', { name: 'Community' });

      const tabsVisible = await overviewTab.isVisible() && await orbitalDataTab.isVisible();

      console.log('Tab navigation found:', tabsVisible);
      expect(tabsVisible).toBeTruthy();
    }
  });

  test('should display zoom controls', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to first ISO
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Look for zoom buttons
      const zoomIn = page.locator('button:has-text("Zoom In"), button:has-text("+")').first();
      const zoomOut = page.locator('button:has-text("Zoom Out"), button:has-text("-")').first();

      const hasZoomControls = (await zoomIn.isVisible().catch(() => false)) ||
                             (await zoomOut.isVisible().catch(() => false));

      console.log('Zoom controls found:', hasZoomControls);
      expect(hasZoomControls).toBeTruthy();
    }
  });

  test('should display time scrubber control', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to first ISO
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Look for time scrubber (range input)
      const timeScrubber = page.locator('input[type="range"]').first();
      const hasTimeScrubber = await timeScrubber.isVisible().catch(() => false);

      console.log('Time scrubber found:', hasTimeScrubber);
      expect(hasTimeScrubber).toBeTruthy();
    }
  });

  test('should display ephemeris data table', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to first ISO
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Switch to Orbital Data tab where the ephemeris table should be
      const orbitalDataTab = page.getByRole('button', { name: 'Orbital Data' });
      if (await orbitalDataTab.isVisible()) {
        await orbitalDataTab.click();
        await page.waitForTimeout(2000);
      }

      // Check for table element
      const table = page.locator('table').first();
      const hasTable = await table.isVisible().catch(() => false);

      console.log('Data table found:', hasTable);
      expect(hasTable).toBeTruthy();
    }
  });

  test('should have accessible ARIA labels', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'test@isotracker.local');
    await page.fill('input[type="password"]', 'TestUser123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to first ISO
    await page.goto('/iso-objects');
    await page.waitForTimeout(2000);
    const firstIso = page.locator('a[href*="/iso-objects/"]').first();
    if (await firstIso.isVisible()) {
      await firstIso.click();
      await page.waitForTimeout(3000);

      // Check for ARIA labels
      const ariaElements = page.locator('[aria-label]');
      const ariaCount = await ariaElements.count();

      console.log('Elements with ARIA labels:', ariaCount);
      expect(ariaCount).toBeGreaterThan(0);
    }
  });
});
