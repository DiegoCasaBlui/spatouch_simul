import { test, expect, type Page } from '@playwright/test';

async function start(page: Page) {
  await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click();
}
async function codeEntry(page: Page) {
  await page.getByRole('button', { name: 'Spa Home', exact: true }).click();
  await page.getByRole('button', { name: 'Control My Spa', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm registration', exact: true }).click();
  await page.getByRole('button', { name: 'CMS:', exact: true }).click();
}

test('Wi-Fi selection, cancellation, keyboard and CMS QR registration', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await start(page);
  await expect(page.getByRole('group', { name: 'Wi-Fi networks' }).getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Control My Spa', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Garden WiFi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Garden WiFi', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.panel-host').screenshot({ path: 'test-results/wifi-networks.png' });
  await page.getByRole('button', { name: 'Control My Spa', exact: true }).click();
  await expect(page.getByText('Would you like to register the spa?', { exact: true })).toBeVisible();
  await page.locator('.panel-host').screenshot({ path: 'test-results/wifi-confirm.png' });
  await page.getByRole('button', { name: 'Cancel registration', exact: true }).click();
  await codeEntry(page);
  await expect(page.getByRole('button', { name: 'Finish CMS code' })).toBeDisabled();
  await page.getByRole('button', { name: 'Shift', exact: true }).click();
  for (const key of ['W', 'N', 'Z', 'A']) await page.getByRole('button', { name: `Key ${key}`, exact: true }).click();
  await page.getByRole('button', { name: 'Backspace', exact: true }).click();
  await page.getByRole('button', { name: 'Numbers and symbols', exact: true }).click();
  for (const key of '-69070') await page.getByRole('button', { name: `Key ${key}`, exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'CMS code', exact: true })).toHaveValue('WNZ-69070');
  await page.getByRole('button', { name: 'Letters', exact: true }).click();
  await page.locator('.panel-host').screenshot({ path: 'test-results/wifi-keyboard.png' });
  await page.getByRole('button', { name: 'Finish CMS code' }).click();
  await expect(page.getByRole('heading', { name: 'CMS', exact: true })).toBeVisible();
  await expect(page.getByText('CMS Code: WNZ-69070', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'CMS registration QR code' })).toBeVisible();
  await page.locator('.panel-host').screenshot({ path: 'test-results/wifi-qr.png' });
  const firstQR = await page.locator('.cms-result>svg').innerHTML();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.locator('.panel-host').screenshot({ path: 'test-results/wifi-code.png' });
  await page.getByRole('button', { name: 'CMS:', exact: true }).click();
  await page.getByRole('textbox', { name: 'CMS code', exact: true }).fill('CHANGED');
  await page.getByRole('button', { name: 'Cancel code entry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'CMS:', exact: true })).toHaveText('WNZ-69070');
  await page.getByRole('button', { name: 'CMS:', exact: true }).click();
  await page.getByRole('textbox', { name: 'CMS code', exact: true }).fill('NEW-123');
  await page.getByRole('textbox', { name: 'CMS code', exact: true }).press('Enter');
  expect(await page.locator('.cms-result>svg').innerHTML()).not.toBe(firstQR);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wi-Fi', exact: true })).toHaveAttribute('title', 'Cloud');
  await page.reload(); await expect(page.getByRole('button', { name: 'Wi-Fi', exact: true })).toHaveAttribute('title', 'Offline');
  expect(errors).toEqual([]);
});

test('Wi-Fi keyboard and QR fit mobile, including inverted display', async ({ page }) => {
  await start(page); await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Invert display', exact: true }).click();
  await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click();
  await codeEntry(page); await page.getByRole('button', { name: 'Key a', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'CMS code', exact: true })).toHaveValue('a');
  await page.getByRole('button', { name: 'Finish CMS code' }).click();
  await expect(page.getByText('CMS Code: A', { exact: true })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Invert display', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click(); await codeEntry(page);
  await page.getByRole('textbox', { name: 'CMS code', exact: true }).fill('WNZ-69070');
  await page.screenshot({ path: 'test-results/wifi-mobile-keyboard.png', fullPage: true });
  await page.getByRole('button', { name: 'Finish CMS code' }).click();
  const panel = await page.locator('.panel-host').boundingBox();
  const qr = await page.getByRole('img', { name: 'CMS registration QR code' }).boundingBox();
  expect(qr!.y + qr!.height).toBeLessThan(panel!.y + panel!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/wifi-mobile-qr.png', fullPage: true });
});

test('touch input completes the CMS flow on a phone', async ({ playwright }) => {
  const browser = await playwright.chromium.launch({ channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); await page.goto('http://127.0.0.1:5173/');
    for (const name of ['Wi-Fi', 'Guest Network', 'Control My Spa', 'Confirm registration', 'CMS:', 'Key a', 'Numbers and symbols', 'Key 1', 'Finish CMS code']) {
      await page.getByRole('button', { name, exact: true }).tap();
    }
    await expect(page.getByText('CMS Code: A1', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'CMS registration QR code' })).toBeVisible();
  } finally { await browser.close(); }
});
