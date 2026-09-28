import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BAR_HEIGHT, HUB, KIT, defined, expect, root, test } from './fixtures';
import { FONTS, LICENSES, source, target } from '../scripts/fonts.mjs';

test('the hub draws one card per registered tool, from the registry', async ({ page, errors }) => {
  await page.goto(HUB);
  await defined(page);
  const tools = await page.evaluate(() => (window as unknown as { NestTools: { tools: { name: string; href: string }[] } }).NestTools.tools);
  const cards = page.locator('#tools .card');
  await expect(cards).toHaveCount(tools.length);
  for (const [i, tool] of tools.entries()) {
    const link = cards.nth(i).getByRole('link', { name: tool.name, exact: true });
    await expect(link).toHaveAttribute('href', tool.href);
  }
  await expect(cards.first().locator('.card-place')).toHaveText('nestpass.ai/activities');
  // The hub is not a tool: nothing is marked current.
  await expect(page.locator('nest-nav [aria-current]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the hub is public but asks search engines to stay away', async ({ page }) => {
  await page.goto(HUB);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('the hub renders in its own fonts, with no third-party requests', async ({ page, context }) => {
  const outside: string[] = [];
  context.on('request', (r) => !r.url().startsWith(HUB) && outside.push(r.url()));
  await page.goto(HUB);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('400 40px "Archivo Black"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('600 13px Montserrat'))).toBe(true);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Archivo Black/);
  expect(outside).toEqual([]);
});

test('whole cards are the link, and the Open pill is not a second one', async ({ page }) => {
  await page.goto(HUB);
  await defined(page);
  const card = page.locator('#tools .card').first();
  await expect(card.getByRole('link')).toHaveCount(1);
  const box = (await card.boundingBox())!;
  await card.click({ position: { x: box.width - 30, y: box.height - 20 } });
  await expect(page).toHaveURL('https://nestpass.ai/activities/');
});

test('without the kit, the hub keeps its 54 px strip', async ({ page, context }) => {
  await context.route(KIT, (route) => route.abort());
  await page.goto(HUB);
  const nav = page.locator('nest-nav');
  await expect(nav).toHaveText('Nests tools');
  expect(await nav.evaluate((n) => n.getBoundingClientRect().height)).toBe(BAR_HEIGHT);
});

test('web/fonts holds exactly the pinned @fontsource files (npm run fonts)', () => {
  for (const [pkg, file] of FONTS) expect(readFileSync(target(file)).equals(readFileSync(source(pkg, file))), file).toBe(true);
  for (const [pkg, file, as] of LICENSES) expect(readFileSync(target(as)).equals(readFileSync(source(pkg, file))), as).toBe(true);
  expect(readFileSync(join(root, 'web', 'hub.css'), 'utf8').match(/url\(fonts\/[^)]+\)/g)?.length).toBe(FONTS.length);
});
